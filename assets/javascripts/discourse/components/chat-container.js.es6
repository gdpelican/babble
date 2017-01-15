import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'

export default MountWidget.extend({
  widget: 'babble-chat',
  selector: '#main-outlet .babble-chat',

  buildArgs() {
    return {
      topic: this.get('topic'),
      container: this,
      lastReadPostNumber: this.get('topic.last_read_post_number'),
      fullpage: this.get('fullpage'),
      canSignUp: this.get('application.canSignUp')
    }
  },

  didInsertElement() {
    this._super()
    Babble.bind(this.get('topic'), this.get('selector'), this.get('nearPost'))
  },

  didRemoveElement() {
    this._super()
    Babble.unbind(this.get('topic'), this.get('selector'))
  }
})
