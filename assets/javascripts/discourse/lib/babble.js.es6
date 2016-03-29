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

    let currentTopicVersion = self.get('currentTopicVersion') || 0
    self.set('currentTopicVersion', currentTopicVersion + 1)
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

  stagePost: function(text) {
    const self = Discourse.Babble
    const user = Discourse.User.current()

    var postStream = self.get('currentTopic.postStream')
    var post = Post.create({
      raw: text,
      cooked: text,
      name: user.get('name'),
      display_username: user.get('name'),
      username: user.get('username'),
      user_id: user.get('id'),
      user_title: user.get('title'),
      avatar_template: user.get('avatar_template'),
      user_custom_fields: user.get('custom_fields'),
      moderator: user.get('moderator'),
      admin: user.get('admin')
    })
    postStream.set('loadedAllPosts', true)
    postStream.stagePost(post, user)
    self.set('latestPost', post)
  },

  handleNewPost: function(data) {
    const self = Discourse.Babble

    var postStream = self.get('currentTopic.postStream')
    var post = Post.create(data)
    post.set('created_at', moment(data.created_at, 'YYYY-MM-DD HH:mm:ss Z'))
    self.set('latestPost', post)

    if (self.lastPostIsMine()) {
      self.clearStagedPost()
      postStream.commitPost(post)
    } else {
      postStream.appendPost(post)
    }
  },

  clearStagedPost: function() {
    const self = Discourse.Babble
    var postStream = self.get('currentTopic.postStream')
    var staged = postStream.findLoadedPost(-1)
    if (staged) { postStream.removePosts([staged]) }
  }
})
