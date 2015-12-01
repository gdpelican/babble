import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'

export default Ember.Object.create({

  setCurrentTopic: function(data) {
    const self = Discourse.Babble

    if (!data.id) {
      self.set('currentTopic', null)
      self.set('currentTopicId', null)
      self.set('latestPost', null)
      return
    }

    var resetTopicField = function(topic, field) {
      topic[field] = data[field]
      if (!topic[field] && self.get('currentTopic')) { topic[field] = self.get('currentTopic')[field] }
    }

    var topic = Topic.create(data)
    resetTopicField(topic, 'last_read_post_number')
    resetTopicField(topic, 'highest_post_number')

    if (self.get('currentTopicId') != topic.id) {
      const messageBus = Discourse.__container__.lookup('message-bus:main')
      if (self.get('currentTopicId')) {
        messageBus.unsubscribe('/babble/topics/' + self.get('currentTopicId'))
        messageBus.unsubscribe('/babble/topics/' + self.get('currentTopicId') + '/posts')
      }
      self.set('currentTopicId', topic.id)
      messageBus.subscribe('/babble/topics/' + self.get('currentTopicId'), self.setCurrentTopic)
      messageBus.subscribe('/babble/topics/' + self.get('currentTopicId') + '/posts', self.handleNewPost)

      var postStream = PostStream.create(topic.post_stream)
      postStream.posts = topic.post_stream.posts
      postStream.topic = topic

      topic.postStream = postStream
    } else {
      topic.postStream = self.get('currentTopic.postStream')
    }

    var totalUnreadCount = topic.highest_post_number - topic.last_read_post_number
    var windowUnreadCount = _.min([totalUnreadCount, topic.postStream.posts.length])

    self.set('unreadCount', windowUnreadCount)
    self.set('hasAdditionalUnread', totalUnreadCount > windowUnreadCount)
    self.set('currentTopic', topic)
  },

  setAvailableTopics: function() {
    return Discourse.ajax('/babble/topics.json').then(function(data) {
      Discourse.Babble.set('availableTopics', (data || {}).topics || [])
    })
  },

  lastPostIsMine: function() {
    return Discourse.Babble.get('latestPost.user_id') == Discourse.User.current().id
  },

  handleNewPost: function(data) {
    const self = Discourse.Babble

    var postStream = self.get('currentTopic.postStream')
    var post = postStream.storePost(Post.create(data))
    post.created_at = moment(data.created_at, 'YYYY-MM-DD HH:mm:ss Z')
    postStream.appendPost(post)

    self.set('latestPost', post)

    if (self.lastPostIsMine()) {
      self.set('unreadCount', 0)
    } else {
      var topic = self.get('currentTopic')
      self.set('unreadCount', topic.highest_post_number - topic.last_read_post_number)
    }
  }
})
