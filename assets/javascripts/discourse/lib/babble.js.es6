import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'

export default Ember.Object.create({

  disabled: function() {
    return _.contains(Discourse.Site.current().disabled_plugins, 'babble')
  },

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
      postStream.topic = topic
      postStream.updateFromJson(topic.post_stream)

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
    let postStream = self.get('currentTopic.postStream')
    if (data.user_id != Discourse.User.current().id) {
      _.each(['can_edit', 'can_delete'], function(key) { delete data[key] })
    }

    let post = Post.create(data)

    if (data.is_edit || data.is_delete) {
      postStream.storePost(post)
      postStream.findLoadedPost(post.id).updateFromPost(post)
    } else {
      post.set('created_at', moment(data.created_at, 'YYYY-MM-DD HH:mm:ss Z'))
      self.set('latestPost', post)

      if (self.lastPostIsMine()) {
        self.clearStagedPost()
        postStream.commitPost(post)
        self.set('unreadCount', 0)
      } else {
        postStream.appendPost(post)
        var topic = self.get('currentTopic')
        self.set('unreadCount', topic.highest_post_number - topic.last_read_post_number)
      }
    }
  },

  clearStagedPost: function() {
    const self = Discourse.Babble
    var postStream = self.get('currentTopic.postStream')
    var staged = postStream.findLoadedPost(-1)
    if (staged) { postStream.removePosts([staged]) }
  }
})
