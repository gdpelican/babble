import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-menu'
import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-menu', {
  tagName: 'li.babble-menu',

  defaultState(attrs) {
    return {
      viewingChat: attrs.viewingChat,
      lastReadPostNumber: attrs.lastReadPostNumber
    }
  },

  toggleView() {
    this.state.viewingChat = !this.state.viewingChat
    this.sendWidgetAction('toggleBabbleViewingChat')
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
  },

  html() { return template.render(this) }
});
