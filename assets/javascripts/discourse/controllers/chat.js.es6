import Babble from '../lib/babble'

export default Ember.Controller.extend({

  topic: function() {
    return Babble.get('currentTopic')
  }.property()

})
