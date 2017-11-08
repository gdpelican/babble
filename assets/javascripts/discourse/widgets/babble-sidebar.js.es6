import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-sidebar'
import { h } from 'virtual-dom'

export default createWidget('babble-sidebar', {
  tagName: 'div.babble-sidebar-wrapper',
  buildKey: () => `babble-sidebar`,

  defaultState(attrs) {
    return {
      visible:   attrs.visible,
      topic:     attrs.topic,
      view:      'chat'
    }
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

  viewChat(topic, postNumber) {
    this.state.view = 'chat'
    this.sendWidgetAction('open', topic, postNumber)
  },

  viewChannels() {
    this.state.view = 'channels'
  }
})
