import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-sidebar'

export default createWidget('babble-sidebar', {
  tagName: 'div.babble-sidebar-wrapper',
  buildKey({ topic }) {
    if (!topic) { return 'babbleSidebar' }
    return `babbleSidebar${topic.id}`
  },

  defaultState({ topic }) {
    return { view: topic ? 'chat' : 'channels' }
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
    this.sendWidgetAction('channelView')
  }
})
