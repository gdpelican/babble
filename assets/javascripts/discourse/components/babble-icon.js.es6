export default Ember.Component.extend({

  tagName: 'li',
  topicVersion: 0,

  icon: Ember.computed(function() { return $(this.element).find(".babble-icon"); }),
  topic: Ember.computed('topicVersion', function() { return Discourse.Babble && Discourse.Babble.topic }),
  
  unreadCount: Ember.computed('topicVersion', function() {
    var topic = this.get('topic')
    var icon = this.get("icon")
    // icon is active or invisible, so no need to show unread count
    if (!topic || icon.is(".active, :not(:visible)")) { 
        return 0 
    }
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

        var resetTopicField = function(topic, field) {
          topic[field] = data[field]
          if (!topic[field] && Discourse.Babble.topic) { topic[field] = Discourse.Babble.topic[field] }
        }

        var topic = Discourse.Topic.create(data)
        resetTopicField(topic, 'last_read_post_number')
        resetTopicField(topic, 'highest_post_number')

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
