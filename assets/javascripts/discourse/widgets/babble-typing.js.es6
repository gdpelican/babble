import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-typing'

export default createWidget('babble-typing', {
  defaultState(attrs) {
    return { topic: attrs.topic }
  },

  html() { return template.render(this) },
})
