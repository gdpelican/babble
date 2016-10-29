import Babble from '../lib/babble'

export default Ember.Controller.extend({
  fullpage: true,

  topic: function() {
    return Babble.get('currentTopic')
  }.property()

})
