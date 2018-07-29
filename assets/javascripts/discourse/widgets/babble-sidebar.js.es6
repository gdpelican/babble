import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-sidebar'
import { h } from 'virtual-dom'

export default createWidget('babble-sidebar', {
  tagName: 'div.babble-sidebar-wrapper',
  buildKey(attrs) {
    if (!attrs.topic) { return 'babbleSidebar' }
    return `babbleSidebar${attrs.topic.id}`
  },

  defaultState(attrs) {
    return { view: attrs.topic ? 'chat' : 'channels' }
  },

  html() {
    return template.render(this)
  },

  expandChat() {
    this.state.expanded = true
    Ember.run.scheduleOnce('afterRender', this, () => { this.scheduleRerender() })
  },

  compressChat() {
    this.state.expanded = false
    Ember.run.scheduleOnce('afterRender', this, () => { this.scheduleRerender() })
  },

  open(topic, postNumber) {
    this.state.view = 'chat'
    this.sendWidgetAction('openChat', topic, postNumber)
  },

  viewChannels() {
    this.state.view = 'channels'
  }
})
