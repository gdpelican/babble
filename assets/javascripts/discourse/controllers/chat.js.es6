import Babble from '../lib/babble'

export default Ember.Controller.extend({
  fullpage: true,

  _observeBabbleChanges: function() {
    Babble.addObserver('currentTopic.id', () => {
      this.set('topic', Babble.get('currentTopic'))
    })
  }.on('init'),

  typeClass: function() {
    if (this.get('fullpage')) {
      return 'fullpage'
    }
  }.property()

})
