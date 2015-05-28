
export default Ember.Component.extend({

  fetchOrSetTopic: function() {
    if (Discourse.Babble == null) {
      var _this = this
      Discourse.ajax('/babble/topic.json').then(function(topic) {
        Discourse.Babble = {
          topic: Discourse.Topic.create(topic),
          postStream: Em.Object.create(topic.post_stream)
        }
        _this.setupTopic()
      })
    } else { this.setupTopic() }
  }.on('init'),

  loading: Ember.computed.empty('model'),

  setupTopic: function() {
    this.set('model',            Discourse.Babble.topic)
    this.set('model.postStream', Discourse.Babble.postStream)
    Discourse.MessageBus.subscribe('/babble', function(data) {
      console.log('success!')
      console.log(data)
    })
  }

});
