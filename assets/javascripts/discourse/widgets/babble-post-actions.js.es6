import { createWidget } from 'discourse/widgets/widget'
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post-actions'

export default createWidget('babble-post-actions', {
  tagName: 'button.babble-post-actions',

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
    console.log('Do you have a flag?')
  },

  delete() {
    Babble.destroyPost(this.state.topic, this.state.post)
  },

  html() { return template.render(this) }
})
