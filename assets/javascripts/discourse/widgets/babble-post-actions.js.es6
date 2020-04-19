import { createWidget } from 'discourse/widgets/widget'
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post-actions'
import { positionDropdown } from '../lib/chat-element-utils'

export default createWidget('babble-post-actions', {

  buildKey({ post }) {
    return `babble-post-actions-${post.id}`
  },

  defaultState({ topic, post }) {
    return { topic, post, open: false }
  },

  open(e) {
    positionDropdown(e, '.babble-post-actions-menu')
    this.state.open = true
    this.scheduleRerender()
  },

  edit() {
    Babble.editPost(this.state.topic, this.state.post)
  },

  flag() {
    Babble.flagPost(this.state.topic, this.state.post)
  },

  delete() {
    Babble.destroyPost(this.state.topic, this.state.post)
  },

  clickOutside() {
    if (!this.state.open) { return }
    this.state.open = false
    this.scheduleRerender()
  },

  html() { return template.render(this) }
})
