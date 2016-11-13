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
      lastReadPostNumber: attrs.lastReadPostNumber,
      loadingPreviousPosts: Babble.get('loadingPreviousPosts'),
      firstLoadedPostNumber: Babble.firstLoadedPostNumber()
    }
  },

  loadPreviousPosts() {
    Babble.loadPreviousPosts()
  },

  html() { return template.render(this) }
});
