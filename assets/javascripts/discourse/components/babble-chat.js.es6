
export default Ember.Component.extend({

  setupTopic: function() {
    var _this = this;
    this.set('loadingBabble', true)
    Discourse.ajax(Discourse.getURL("/babble/topic.json")).then(function(topic) {
      _this.set('loadingBabble', false)
      _this.set('model', Discourse.Topic.create(topic))
      _this.set('model.postStream', Em.Object.create(topic.post_stream))
    });
  }.on('init'),

});
