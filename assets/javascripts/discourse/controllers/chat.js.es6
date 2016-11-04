import Babble from '../lib/babble'

export default Ember.Controller.extend({
  fullpage: true,

  typeClass: function() {
    if (this.get('fullpage')) {
      return 'fullpage'
    }
  }.property()

})
