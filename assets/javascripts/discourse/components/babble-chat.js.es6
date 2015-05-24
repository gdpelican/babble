
export default Ember.Component.extend({
  setupTopic: function() {
    var _this = this;
    Discourse.Topic.find(-1, {}).then(function(topic) {
      _this.set('topic', topic);
    });
  }.on('init'),

  topicTitle: function() {
    if (this.get('topic')) {
      return this.get('topic').title
    } else {
      return "No topic yet";
    }
  }.property('topic')
});
