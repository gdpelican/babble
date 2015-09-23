export default Ember.Object.create({

  setCurrentTopic: function(data) {
    const self = Discourse.Babble

    if (!data.id) {
      self.set('currentTopic', null)
      self.set('currentTopicId', null)
      self.set('latestPost', null)
      return
    }

    const messageBus = Discourse.__container__.lookup('message-bus:main')

    var resetTopicField = function(topic, field) {
      topic[field] = data[field]
      if (!topic[field] && self.get('currentTopic')) { topic[field] = self.get('currentTopic')[field] }
    }

    var humanizeGroupName = function(group) {
      if (!group.name) { return '' }
      return group.name.charAt(0).toUpperCase() + group.name.slice(1).replace(/_/g, ' ')
    }

    var topic = Discourse.Topic.create(data)
    resetTopicField(topic, 'last_read_post_number')
    resetTopicField(topic, 'highest_post_number')

    if (self.get('currentTopicId') != topic.id) {
      if (self.get('currentTopicId')) {
        messageBus.unsubscribe('/babble/topics/' + self.get('currentTopicId'))
        messageBus.unsubscribe('/babble/topics/' + self.get('currentTopicId') + '/posts')
      }
      self.set('currentTopicId', topic.id)
      messageBus.subscribe('/babble/topics/' + self.get('currentTopicId'), self.setCurrentTopic)
      messageBus.subscribe('/babble/topics/' + self.get('currentTopicId') + '/posts', self.handleNewPost)

      var postStream = Discourse.PostStream.create(topic.post_stream)
      postStream.posts = topic.post_stream.posts
      postStream.topic = topic

      topic.postStream = postStream
      topic.details.group_names = _.map(topic.details.allowed_groups, humanizeGroupName).join(', ')
    } else {
      topic.postStream = self.get('currentTopic.postStream')
    }

    self.set('currentTopic', topic)
  },

  setAvailableTopics: function(data) {
    Discourse.Babble.set('availableTopics', (data || {}).topics || [])
  },

  handleNewPost: function(data) {
    var postStream = Discourse.Babble.get('currentTopic.postStream')
    var post = postStream.storePost(Discourse.Post.create(data))
    post.created_at = moment(data.created_at, 'YYYY-MM-DD HH:mm:ss Z')
    postStream.appendPost(post)
    Discourse.Babble.set('latestPost', post)
  }
})
