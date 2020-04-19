import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-online'

export default createWidget('babble-online', {
  buildKey({ topic }) {
    return `babble-online-${topic.id}`
  },

  defaultState({ topic }) {
    return { topic }
  },

  html() { return template.render(this) },
})
