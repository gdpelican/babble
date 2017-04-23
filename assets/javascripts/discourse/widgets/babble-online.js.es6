import { createWidget } from 'discourse/widgets/widget';
import shoutboxTemplate from '../widgets/templates/babble-online-shoutbox'
import fullpageTemplate from '../widgets/templates/babble-online-fullpage'

export default createWidget('babble-online', {
  buildKey(attrs) {
    return `babble-online-${attrs.topic.id}`
  },

  defaultState(attrs) {
    return { topic: attrs.topic, fullpage: attrs.fullpage }
  },

  html() {
    if (this.state.fullpage) {
      return fullpageTemplate.render(this)
    } else {
      return shoutboxTemplate.render(this)
    }
  }
})
