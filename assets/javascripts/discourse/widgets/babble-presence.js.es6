import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-presence'

export default createWidget('babble-presence', {
  defaultState(attrs) {
    return { topic: attrs.topic }
  },

  html() { return template.render(this) },
})
