import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'

export default MountWidget.extend({
  widget: 'babble-fullpage',

  buildArgs() {
    return {
      topic:     Babble.topicForComponent(this),
      canSignUp: this.application.canSignUp
    }
  },

  didInsertElement() {
    this._super()
    this.set('topic', Babble.bind(this, this.topic))
  },

  willDestroyElement() {
    this._super()
    Babble.unbind(this)
  }
})
