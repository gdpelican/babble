import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-sidebar'

export default createWidget('babble-sidebar', {
  buildKey(attrs) {
    return `babble-sidebar-${attrs.topic.id}`
  },

  defaultState(attrs) {
    return { topic: attrs.topic }
  },

  html() {
    return template.render(this)
  }
})
