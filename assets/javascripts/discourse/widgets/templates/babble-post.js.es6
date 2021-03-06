import { h } from 'virtual-dom'
import RawHtml from 'discourse/widgets/raw-html';
import { relativeAge, longDate } from 'discourse/lib/formatter'
import { avatarImg } from 'discourse/widgets/post'
import { emojiUnescape } from 'discourse/lib/text'
import { iconNode } from "discourse-common/lib/icon-library";

export default Ember.Object.create({
  render(widget) {
    this.widget     = widget
    this.post       = widget.state.post
    this.topic      = widget.state.topic
    this.isFollowOn = widget.state.isFollowOn
    this.isNewDay   = widget.state.isNewDay
    this.staged     = this.topic.get('loadingEditId') === this.post.id || this.post.id == -1
    this.editing    = this.topic.get('editingPostId') === this.post.id
    return this.container()
  },

  container() {
    let css = 'div.babble-post-container'
    if (this.isFollowOn) { css += '.babble-follow-on' }
    return [
      this.daySeparator(),
      h(css, this.contents()),
      this.unreadLine()
    ]
  },

  contents() {
    return [
      this.avatarWrapper(),
      h('div.babble-post-content-wrapper', [
        this.title(),
        this.body(),
      ]),
      this.post.yours ? null : this.actions()
    ]
  },

  body() {
    if (this.post.deleted_at) {
      return h('div.babble-staged-post.babble-deleted-post', I18n.t('babble.post_deleted_by', {username: this.post.deleted_by_username}))
    } else if (this.post.user_deleted) {
      return h('div.babble-staged-post.babble-deleted-post', this.cooked())
    } else if (this.topic.get('editingPostId') === this.post.id ){
      return this.widget.attach('babble-composer', {
        post:      this.post,
        topic:     this.topic,
        isEditing: true,
        raw:       this.post.raw
      })
    } else if(this.staged) {
      return h('div.babble-staged-post', this.cooked())
    } else {
      return h('div.babble-post-content', this.cooked())
    }
  },

  avatarWrapper() {
    if (this.post.yours) { return }

    return h('a.babble-avatar-wrapper', { attributes: {
      'data-user-card': this.post.username,
      'href': `/u/${this.post.username}`
    } }, this.avatar())
  },

  avatar() {
    if (this.isFollowOn) {
      return h('div.babble-avatar-placeholder')
    } else if (this.post.user_id) {
      return avatarImg('medium', {template: this.post.avatar_template, username: this.post.username})
    } else {
      return iconNode('far-trash-alt', { class: 'deleted-user-avatar'} )
    }
  },

  postName() {
    return h('div.babble-post-name', this.widget.attach('poster-name', this.post))
  },

  postDate() {
    const timestamp = new Date(this.post.created_at)
    return h('div.babble-post-date',
      { attributes: { title: longDate(timestamp) } },
      relativeAge(timestamp)
    )
  },

  postEdited() {
    if (this.post.yours || !(this.post.self_edits > 0)) { return }

    return h('div.babble-post-explainer',
      { attributes: { title: I18n.t('babble.post_edited') } },
      iconNode('pencil-alt')
    )
  },

  postFlagged() {
    if (!this.post.has_flagged) { return }

    return h('div.babble-post-explainer',
      { attributes: { title: I18n.t('babble.flagged') } },
      iconNode('flag')
    )
  },

  title() {
    const actions = this.post.yours ? this.actions() : null
    if (this.isFollowOn) {
      return h('div.babble-post-meta-data', actions)
    } else {
      return h('div.babble-post-meta-data', [
        this.postName(),
        this.postDate(),
        this.postFlagged(),
        this.postEdited(),
        actions
      ])
    }
  },

  cooked() {
    return new RawHtml({ html: `<div class="babble-post-cooked">${emojiUnescape(this.post.cooked)}</div>` })
  },

  daySeparator() {
    if (!this.isNewDay) { return }
    let date = moment(new Date(this.post.created_at))
                     .startOf('day')
                     .calendar({ lastWeek: 'dddd' })
                     .replace('at 12:00 AM', '')
    return h('div.babble-post-new-day-message.babble-post-hr-message', h('span', date))
  },

  unreadLine() {
    if (this.post.post_number != this.topic.lastReadMarker) { return }
    return h('div.babble-last-read.babble-post-hr-message', h('span', I18n.t('babble.new_messages')))
  },

  actions() {
    if (this.editing || this.post.deleted_at) { return }
    if (this.staged) { return this.loadingSpinner() }
    return this.widget.attach('babble-post-actions', { topic: this.topic, post: this.post })
  },

  loadingSpinner() {
    return h('div.spinner-container', h('div.spinner'))
  }
})
