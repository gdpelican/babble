import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-chat'
import Babble from '../lib/babble'

export default createWidget('babble-chat', {
  tagName: 'div.babble-chat',

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      container: attrs.container,
      fullpage: attrs.fullpage
    }
  },

  loadPosts(direction) {
    Babble.loadPosts(this.state.topic, direction)
  },

  html() { return template.render(this) }
});
