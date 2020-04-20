import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-post'

import User from 'discourse/models/user'

export default createWidget('babble-post', {
  tagName: 'li.babble-post',
  shadowTree: true,

  buildKey({ post }) {
    return `babble-post-${post.id}`
  },

  buildAttributes() {
    const { id, user_id, post_number } = this.state.post
    return {
      'data-post-id':     id,
      'data-user-id':     user_id,
      'data-post-number': post_number,
      'data-my-post':     user_id === User.currentProp('id')
    }
  },

  defaultState({ post, topic, isFollowOn, isNewDay }) {
    return { post, topic, isFollowOn, isNewDay, editedRaw: post.raw }
  },

  html() { return template.render(this) }
})
