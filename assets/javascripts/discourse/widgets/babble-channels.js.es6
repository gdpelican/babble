import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-channels'
import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-channels', {
  tagName: 'div.babble-channels',

  changeTopic(topic) {
    Babble.set('loadingTopicId', topic.id)
    ajax(`/babble/topics/${topic.id}.json`).then(
      (data)  => {
        Babble.setCurrentTopic(data)
        Babble.set('loadingTopic', null)
        this.state.viewingChat = true
        this.sendWidgetAction('toggleBabbleViewingChat')
      },
      (error) => { console.log(error) }
    )
  },

  html() { return template.render(this) }
});
