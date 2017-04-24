import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-online'

export default createWidget('babble-online', {
  buildKey(attrs) {
    return `babble-online-${attrs.topic.id}`
  },

  defaultState(attrs) {
    return { topic: attrs.topic }
  },

  html() { return template.render(this) },
})
