import { createWidget } from 'discourse/widgets/widget';
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post'
import { ajax } from 'discourse/lib/ajax'
import showModal from 'discourse/lib/show-modal'

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
    ajax(`/babble/topics/${post.topic_id}/destroy/${post.id}`, {
      type: 'DELETE'
    }).finally(() => {
      Babble.set('loadingEditId', null)
    })
  },

  flag() {
    let post = this.state.post
    showModal('flag', {model: this.state.post}).setProperties({ selected: null, flagTopic: false })
  },

  html() { return template.render(this) }
})
