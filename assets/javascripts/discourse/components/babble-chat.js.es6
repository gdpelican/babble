
export default Ember.Component.extend({

  fetchOrSetTopic: function() {
    if (Discourse.Babble == null) {
      var _this = this
      Discourse.ajax('/babble/topic.json').then(function(topic) {
        var topic = Discourse.Topic.create(topic)
        var postStream = Discourse.PostStream.create(topic.post_stream)
        postStream.posts = topic.post_stream.posts
        Discourse.Babble = { topic: topic, postStream: postStream }
        _this.setupTopic()
      })
    } else { this.setupTopic() }
  }.on('init'),

  loading: Ember.computed.empty('topic'),

  setupTopic: function() {
    this.set('topic',            Discourse.Babble.topic)
    this.set('topic.postStream', Discourse.Babble.postStream)
    this.setupMessageBus()
  },

  setupMessageBus: function() {
    var _this = this
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    messageBus.subscribe('/babble', function(data) {
      var post = Discourse.Post.create(data)
      post.set('topic', _this.get('topic'))
      _this.get('topic.postStream').appendPost(post)
    })
  }

});
