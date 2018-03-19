import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-channels'
import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-channels', {
  tagName: 'div.babble-channels',

  changeTopic(model) {
    var action
    switch(model.constructor) {
      case Discourse.User:  action = 'loadPM'; break
      case Discourse.Topic: action = 'loadTopic'; break
    }
    Babble[action](model.id).then((topic) => {
      this.sendWidgetAction('viewChat', topic)
    }, console.log)
  },

  html() { return template.render(this) }
});
