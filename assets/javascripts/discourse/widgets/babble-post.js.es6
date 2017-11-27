import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-post'

export default createWidget('babble-post', {
  tagName: 'li.babble-post',

  buildKey(attrs) {
    return `babble-post-${attrs.post.id}`
  },

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

  html() { return template.render(this) }
})
