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
      view:      'channels'
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

  open(topic, postNumber) {
    this.state.view = 'chat'
    this.sendWidgetAction('openChat', topic, postNumber)
  },

  viewChannels() {
    this.state.view = 'channels'
  }
})
