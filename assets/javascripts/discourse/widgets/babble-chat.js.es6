import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-chat'

export default createWidget('babble-chat', {
  tagName: 'div.babble-chat',

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      fullpage: attrs.fullpage,
      lastReadPostNumber: attrs.lastReadPostNumber
    }
  },

  html() { return template.render(this) }
});
