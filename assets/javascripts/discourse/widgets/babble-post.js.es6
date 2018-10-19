import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-post'

import User from 'discourse/models/user'

export default createWidget('babble-post', {
  tagName: 'li.babble-post',
  shadowTree: true,

  buildKey(attrs) {
    return `babble-post-${attrs.post.id}`
  },

  buildAttributes() {
    let post = this.state.post
    let attrs = {
      'data-post-id':     post.id,
      'data-user-id':     post.user_id,
      'data-post-number': post.post_number
    }
    if (post.user_id == User.currentProp('id')) {
      attrs['data-my-post'] = true
    }
    return attrs
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
