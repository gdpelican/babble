export default Ember.Component.extend({

  tagName: 'li',
  topicVersion: 0,

  topic: Ember.computed('topicVersion', function() { return Discourse.Babble && Discourse.Babble.topic }),
  unreadCount: Ember.computed('topicVersion', function() {
    var topic = this.get('topic')
    if (!topic) { return 0 }
    return topic.highest_post_number - topic.last_read_post_number
  }),

  _init: function() {
    const self = this
    const messageBus = Discourse.__container__.lookup('message-bus:main')

    if (!Discourse.Babble) {
      Discourse.Babble = {}
      Discourse.Babble.refresh = function(data) {
        if (!data.id) {
          self.set('noTopicAvailable', true)
          return
        }

        var topic = Discourse.Topic.create(data)
        topic.last_read_post_number = data.last_read_post_number || Discourse.Babble.topic.last_read_post_number
        topic.highest_post_number = data.highest_post_number || Discourse.Babble.topic.highest_post_number

        var postStream = Discourse.PostStream.create(topic.post_stream)
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
