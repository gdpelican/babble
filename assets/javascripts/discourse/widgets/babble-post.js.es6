import { createWidget } from 'discourse/widgets/widget';
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post'

export default createWidget('babble-post', {
  tagName: 'li.babble-post',

  buildAttributes() {
    let post = this.state.post
    return {
      'data-post-id':     post.id,
      'data-user-id':     post.user_id,
      'data-post-number': post.post_number
    }
  },

  defaultState(attrs) {
    return {
      post:       attrs.post,
      isLastRead: attrs.isLastRead,
      editedRaw:  attrs.post.raw
    }
  },

  edit() {
    Babble.editPost(this.state.post)
  },

  delete() {
    let post = this.state.post
    Babble.set('loadingEditId', post.id)
    Discourse.ajax(`/babble/topics/${post.topic_id}/destroy/${post.id}`, {
      type: 'DELETE'
    }).finally(() => {
      Babble.set('loadingEditId', null)
    })
  },

  html() { return template.render(this) }
})
