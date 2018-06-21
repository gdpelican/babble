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

  open(e) {
    setTimeout(() => {
      const rect = document.elementFromPoint(e.clientX, e.clientY).closest('.btn').getBoundingClientRect()
      const menu = document.querySelector('.babble-post-actions-menu')
      menu.style.top  = `${rect.top}px`
      if (document.body.offsetWidth > rect.left + 150) {
        menu.style.left = `${rect.left}px`
      } else {
        menu.style.right = `${document.body.offsetWidth - rect.right}px`
      }
    }, 100)
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
