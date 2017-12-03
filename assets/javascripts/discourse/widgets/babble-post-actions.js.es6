import { createWidget } from 'discourse/widgets/widget'
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post-actions'

export default createWidget('babble-post-actions', {

  buildKey(attrs) {
    return `babble-post-actions-${attrs.post.id}`
  },

  defaultState(attrs) {
    return { topic: attrs.topic, post: attrs.post, open: false }
  },

  open() {
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
