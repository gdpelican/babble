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
    return h('div.babble-post-container', {
      attributes: {
        'data-post-id':     this.post.id,
        'data-user-id':     this.post.user_id,
        'data-post-number': this.post.post_number
      }
    }, this.contents())
  },

  contents() {
    if (this.post.deleted_at) {
      return h('div.babble-deleted-post', I18n.t('babble.post_deleted_by', {username: this.post.deleted_by.username}))
    } else if (Babble.editingPostId === this.post.id ){
      return this.widget.attach('babble-composer', {post: this.post, isEditing: true})
    } else if (Babble.loadingPostId === this.post.id) {
      return h('div.spinner-container', h('div.spinner'))
    } else {
      return [this.avatarWrapper(), this.bodyWrapper()]
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

  bodyWrapper() {
    return h('div.babble-post-content', this.body())
  },

  body() {
    return [this.postDate(), this.cooked(), this.actions()]
  },

  postDate() {
    return h('div.babble-post-date', dateNode(this.post.created_at))
  },

  cooked() {
    return new RawHtml({ html: `<div class="babble-post-cooked">${Discourse.Emoji.unescape(this.post.cooked)}</div>` })
  },

  actions() {
    let actions = []
    if (this.post.can_delete) { actions.push(this.widget.attach('link', { icon: 'trash-o', action: 'delete'})) }
    if (this.post.can_edit)   { actions.push(this.widget.attach('link', { icon: 'pencil', action: 'edit'})) }
    if (this.post.deleted_at || !actions.length) { return }
    return h('div.babble-post-actions', actions)
  }
})
