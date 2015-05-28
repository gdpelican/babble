export default Ember.Controller.extend({
  needs: ['application', 'header', 'topic'],

  setupTopic: function() {
    const self = this;
    Discourse.ajax(Discourse.getURL("/babble/topic.json")).then(function(topic) {
      var babbleTopic = Discourse.Topic.create(topic)
      self.set('model', babbleTopic)
      self.set('model.postStream', babbleTopic.get('postStream'))
      self.subscribe()
    });
  }.on('init'),

  subscribe: function() {
    const self = this;
    const topic = this.get('model')
    const postStream = this.get('model.postStream')
    this.messageBus.subscribe("/topic/" + topic.id, function(data) {
      switch (data.type) {
        case "revised":
        case "acted":
        case "rebaked": { postStream.triggerChangedPost(data.id, data.updated_at); }
        case "deleted": { postStream.triggerDeletedPost(data.id, data.post_number); }
        case "recovered": { postStream.triggerRecoveredPost(data.id, data.post_number); }
        case "created": { postStream.triggerNewPostInStream(data.id); }
        default: { Em.Logger.warn("unknown topic bus message type", data); }
      }
    });
  },

  actions: {}
});