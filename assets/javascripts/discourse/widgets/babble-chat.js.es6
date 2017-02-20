import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-chat'
import Babble from '../lib/babble'

export default createWidget('babble-chat', {
  tagName: 'div.babble-chat',

  buildKey(attrs) { return 'babbleChat' },

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      container: attrs.container,
      fullpage: attrs.fullpage
    }
  },

  loadPostsForward() {
    Babble.loadPosts(this.state.topic, 'asc')
  },

  loadPostsBackward() {
    Babble.loadPosts(this.state.topic, 'desc')
  },

  html() { return template.render(this) }
});
