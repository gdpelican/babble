import { observes } from 'ember-addons/ember-computed-decorators';
export default Ember.Component.extend({

  classNames: ['babble-icon'],
  tagName: 'li',

  _init: function() {
    const self = this
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    self.set('babbleIcon', Discourse.SiteSettings.babble_icon)

    if (!Discourse.Babble) {
      Discourse.Babble = {}
      Discourse.Babble.refresh = function(data) {
        self.set('babbleEnabled', Discourse.SiteSettings.babble_enabled && data.id)
        if (!self.get('babbleEnabled')) { return }

        var resetTopicField = function(topic, field) {
          topic[field] = data[field]
          if (!topic[field] && Discourse.Babble.topic) { topic[field] = Discourse.Babble.topic[field] }
        }

        var humanizeGroupName = function(group) {
          if (!group.name) { return '' }
          return group.name.charAt(0).toUpperCase() + group.name.slice(1).replace(/_/g, ' ')
        }

        var topic = Discourse.Topic.create(data)
        resetTopicField(topic, 'last_read_post_number')
        resetTopicField(topic, 'highest_post_number')

        topic.details.group_names = _.map(topic.details.allowed_groups, humanizeGroupName).join(', ')

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
