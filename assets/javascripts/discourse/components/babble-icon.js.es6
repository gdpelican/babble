import { observes } from 'ember-addons/ember-computed-decorators';
export default Ember.Component.extend({

  classNames: ['babble-icon'],
  tagName: 'li',

  _init: function() {
    const self = this
    const messageBus = Discourse.__container__.lookup('message-bus:main')

    if (!Discourse.Babble) {
      Discourse.Babble = {}
      Discourse.Babble.setCurrentTopic = function(data) {
        self.set('babbleEnabled', Discourse.SiteSettings.babble_enabled && data.id)
        if (!self.get('babbleEnabled')) { return }

        var resetTopicField = function(topic, field) {
          topic[field] = data[field]
          if (!topic[field] && Discourse.Babble.currentTopic) { topic[field] = Discourse.Babble.currentTopic[field] }
        }

        var humanizeGroupName = function(group) {
          if (!group.name) { return '' }
          return group.name.charAt(0).toUpperCase() + group.name.slice(1).replace(/_/g, ' ')
        }

        var topic = Discourse.Topic.create(data)
        resetTopicField(topic, 'last_read_post_number')
        resetTopicField(topic, 'highest_post_number')

        var postStream = Discourse.PostStream.create(topic.post_stream)
        postStream.posts = topic.post_stream.posts
        postStream.topic = topic

        topic.postStream = postStream
        topic.details.group_names = _.map(topic.details.allowed_groups, humanizeGroupName).join(', ')

        if (Discourse.Babble.currentTopic) {
          messageBus.unsubscribe('/babble/topics/' + Discourse.Babble.currentTopic.id)
        }
        messageBus.subscribe('/babble/topics/' + topic.id, Discourse.Babble.setCurrentTopic)

        Discourse.Babble.currentTopic = topic

        self.set('unreadCount', topic.highest_post_number - topic.last_read_post_number)
      }

      Discourse.Babble.setAvailableTopics = function(data) {
        Discourse.Babble.availableTopics = data['topics'] || []
      }
    }

    Discourse.ajax('/babble/topics/default.json').then(Discourse.Babble.setCurrentTopic)
    Discourse.ajax('/babble/topics.json').then(Discourse.Babble.setAvailableTopics)
  }.on('init')
});
