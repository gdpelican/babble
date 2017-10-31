import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'
import { on, observes } from 'ember-addons/ember-computed-decorators'
import { ajax } from 'discourse/lib/ajax'

export default MountWidget.extend({
  widget: 'babble-sidebar',

  buildArgs() {
    let topic = Babble.topicForComponent(this) || {}
    return {
      topic:              topic,
      lastReadPostNumber: topic.last_read_post_number,
      visible:            this.visible
    }
  },

  @observes('visible')
  _updateOutletClass() {
    const $outlet = $('#main-outlet')
    if (this.visible) {
      $outlet.addClass('chat-active')
    } else {
      $outlet.removeClass('chat-active')
    }
    this.rerenderWidget()
  },

  @on('didInsertElement')
  _initialize() {
    Babble.registerDefaultComponent(this)
  },

  toggle() {
    this.set('visible', !this.get('visible'))
  }
})
