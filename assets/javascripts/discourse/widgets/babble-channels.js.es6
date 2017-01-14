import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-channels'
import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-channels', {
  tagName: 'div.babble-channels',

  changeTopic(topic) {
    Babble.loadTopic(topic.id).then((data) => {
      this.sendWidgetAction('toggleBabbleViewingChat', Babble.buildTopic(data))
    }, (error) => {
      console.log()
    })
  },

  html() { return template.render(this) }
});
