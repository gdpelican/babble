export default Ember.Component.extend({

  tagName: 'li',
  topicVersion: 0,

  topic: Ember.computed('topicVersion', function() { return Discourse.Babble && Discourse.Babble.topic }),
  unreadCount: Ember.computed('topicVersion', function() {
    var topic = this.get('topic')
    if (topic) { return topic.unread_count }
    else       { return 0 }
  }),

  _init: function() {
    const self = this
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    
    if (!Discourse.Babble) {
      Discourse.Babble = {}
      Discourse.Babble.refresh = function(data) {
        var topic = Discourse.Topic.create(data)
        var postStream = Discourse.PostStream.create(topic.post_stream)

        topic.unread_count = data.highest_post_number - data.last_read_post_number
        postStream.posts = topic.post_stream.posts
        postStream.topic = topic

        Discourse.Babble.topic = topic
        Discourse.Babble.postStream = postStream
        self.set('topicVersion', self.get('topicVersion') + 1)
      }
    }

    Discourse.ajax('/babble/topic.json').then(Discourse.Babble.refresh)
    messageBus.subscribe('/babble/topic', Discourse.Babble.refresh)
  }.on('init')
});
