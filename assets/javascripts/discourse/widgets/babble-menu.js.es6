import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-menu'
import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-menu', {
  tagName:  'div.babble-menu',

  buildKey(attrs) {
    return `babble-menu`
  },

  defaultState(attrs) {
    return {
      viewingChat:           attrs.viewingChat,
      firstLoadedPostNumber: attrs.firstLoadedPostNumber,
      container:             attrs.container
    }
  },

  toggleView(topic) {
    this.state.viewingChat = !this.state.viewingChat
    if(topic) { this.sendWidgetAction('changeTopic', topic) }
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
  },

  html() {
    return template.render(this)
  }
});
