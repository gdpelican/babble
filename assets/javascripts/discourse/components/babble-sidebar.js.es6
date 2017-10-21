import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'
import { on, observes } from 'ember-addons/ember-computed-decorators'
import { ajax } from 'discourse/lib/ajax'

export default MountWidget.extend({
  widget: 'babble-sidebar',

  buildArgs() {
    let topic = Babble.topicForComponent(this) || {}
    return {
      topic: topic,
      visible: this.visible,
      lastReadPostNumber: topic.last_read_post_number
    }
  },

  setTopic(data) {
    Babble.bind(this, Babble.buildTopic(data))
  },

  @on('didInsertElement')
  _fetchDefaultTopic() {
    if (Babble.disabled() || !Discourse.SiteSettings.babble_shoutbox) { return }
    Ember.run.scheduleOnce('afterRender',() => {
      ajax('/babble/topics/default.json').then((data) => {
        this.setTopic(data)
        this.set('visible', true)
      }, console.log)
    })
  }

})
