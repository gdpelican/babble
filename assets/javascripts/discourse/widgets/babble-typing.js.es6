import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-typing'

export default createWidget('babble-typing', {
  buildKey({ topic }) {
    return `babble-typing-${topic.id}`
  },

  defaultState({ topic }) {
    return { topic }
  },

  html() { return template.render(this) },
})
