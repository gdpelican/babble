import Babble from '../lib/babble'

export default Ember.Controller.extend({

  _observeBabbleChanges: function() {
    Babble.addObserver('currentTopic.id', () => {
      this.set('topic', Babble.get('currentTopic'))
      this.set('availableTopics', Babble.getAvailableTopics(true))
    })
  }.on('init')

})
