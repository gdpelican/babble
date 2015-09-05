import { observes } from 'ember-addons/ember-computed-decorators';
export default Ember.Component.extend({

  classNames: ['babble-icon'],
  tagName: 'li',

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

        self.set('unreadCount', topic.highest_post_number - topic.last_read_post_number)
      }
    }

    Discourse.ajax('/babble/topic.json').then(Discourse.Babble.refresh)
    messageBus.subscribe('/babble/topic', Discourse.Babble.refresh)
  }.on('init')
});
