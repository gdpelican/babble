import { createWidget } from 'discourse/widgets/widget';
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post'
import { ajax } from 'discourse/lib/ajax'

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
      topic:      attrs.topic,
      isFollowOn: attrs.isFollowOn,
      isNewDay:   attrs.isNewDay,
      editedRaw:  attrs.post.raw
    }
  },

  edit() {
    Babble.editPost(this.state.topic, this.state.post)
  },

  delete() {
    Babble.destroyPost(this.state.topic, this.state.post)
  },

  html() { return template.render(this) }
})
