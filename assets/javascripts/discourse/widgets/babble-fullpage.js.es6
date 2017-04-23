import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-fullpage'

export default createWidget('babble-fullpage', {
  buildKey(attrs) {
    return `babble-fullpage-${attrs.topic.id}`
  },

  defaultState(attrs) {
    return { topic: attrs.topic, canSignUp: attrs.canSignUp }
  },

  html() {
    return template.render(this)
  }
})
