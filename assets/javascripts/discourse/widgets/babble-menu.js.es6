import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-menu'
import Babble from '../lib/babble'

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

  changeTopic(topic) {
    Babble.set('loadingTopicId', topic.id)
    Discourse.ajax('/babble/topics/' + topic.id + '.json').then(
      (data)  => {
        Babble.setCurrentTopic(data)
        Babble.set('loadingTopic', null)
        this.state.viewingChat = true
        this.sendWidgetAction('toggleBabbleViewingChat')
      },
      (error) => { console.log(error) }
    )
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
  },

  html() { return template.render(this) }
});
