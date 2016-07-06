import { h } from 'virtual-dom'
import Babble from '../../lib/babble'
import RawHtml from 'discourse/widgets/raw-html';
import { dateNode } from 'discourse/helpers/node';
import { avatarImg } from 'discourse/widgets/post'


export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    this.post   = widget.state.post
    return this.container()
  },

  container() {
    return h('div.babble-post-container', this.contents())
  },

  contents() {
    if (this.post.deleted_at) {
      return h('div.babble-staged-post.babble-deleted-post', [this.avatarWrapper(), I18n.t('babble.post_deleted_by', {username: this.post.deleted_by.username})])
    } else if (Babble.get('editingPostId') === this.post.id ){
      return this.widget.attach('babble-composer', {
        post:      this.post,
        topic:     Babble.currentTopic,
        isEditing: true,
        raw:       this.post.raw})
    } else if (Babble.get('loadingEditId') === this.post.id) {
      return h('div.babble-staged-post', [this.avatarWrapper(), this.bodyWrapper(true)])
    } else {
      return [this.avatarWrapper(), this.bodyWrapper(false)]
    }
  },

  avatarWrapper() {
    return h('div.babble-post-avatar', this.avatar())
  },

  avatar() {
    if (this.post.user_id) {
      return avatarImg('small', {template: this.post.avatar_template, username: this.post.username})
    } else {
      return h('i.fa.fa-trash-o.deleted-user-avatar')
    }
  },

  bodyWrapper(staged) {
    return h('div.babble-post-content', this.body(staged))
  },

  body(staged) {
    if (staged) {
      return [this.cooked(), this.loadingSpinner()]
    } else {
      return [this.postDate(), this.cooked(), this.unreadLine(), this.actions()]
    }
  },

  postDate() {
    return h('div.babble-post-date', dateNode(this.post.created_at))
  },

  cooked() {
    return new RawHtml({ html: `<div class="babble-post-cooked">${Discourse.Emoji.unescape(this.post.cooked)}</div>` })
  },

  unreadLine() {
    if (!this.widget.state.isLastRead) { return }
    return h('div.babble-last-read-wrapper', [
      h('div.babble-last-read-post-message', I18n.t('babble.new_messages')),
      h('hr.babble-last-read-post-line')
    ])
  },

  actions() {
    let actions = []
    if (this.post.can_delete) { actions.push(this.widget.attach('link', { icon: 'trash-o', action: 'delete'})) }
    if (this.post.can_edit)   { actions.push(this.widget.attach('link', { icon: 'pencil', action: 'edit'})) }
    if (this.post.deleted_at || !actions.length) { return }
    return h('div.babble-post-actions', actions)
  },

  loadingSpinner() {
    return h('div.spinner-container', h('div.spinner'))
  }
})
