import User from 'discourse/models/user'
import Babble from '../lib/babble'

export default Ember.Component.extend({
  loadAudio: !Babble.disabled() && User.currentProp('custom_fields.babble_sound')
})
