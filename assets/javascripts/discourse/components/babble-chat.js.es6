
export default Ember.Component.extend({

  setupTopic: function() {
    var _this = this;
    Discourse.ajax(Discourse.getURL("/babble/topic.json")).then(function(topic) {
      _this.set('model', Discourse.Topic.create(topic))
      _this.set('model.postStream', Em.Object.create(topic.post_stream))
    });
  }.on('init'),

  topicTitle: function() {
    if (this.get('model')) {
      return this.get('model').title
    } else {
      return "Loading chat...";
    }
  }.property('model')
});
