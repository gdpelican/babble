import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-channels'
import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-channels', {
  tagName: 'div.babble-channels',

  changeTopic(topic) {
    Babble.loadTopic(topic.id).then((topic) => {
      this.sendWidgetAction('toggleView', topic)
    }, console.log)
  },

  html() { return template.render(this) }
});
