import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-chat'
import Babble from '../lib/babble'

export default createWidget('babble-chat', {
  tagName: 'div.babble-chat',

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      fullpage: attrs.fullpage,
      firstLoadedPostNumber: attrs.firstLoadedPostNumber,
      lastLoadedPostNumber: attrs.lastLoadedPostNumber,
      lastReadPostNumber: attrs.lastReadPostNumber,
      loadingPosts: Babble.get('loadingPosts')
    }
  },

  loadPosts(direction) {
    Babble.loadPosts(direction)
  },

  html() { return template.render(this) }
});
