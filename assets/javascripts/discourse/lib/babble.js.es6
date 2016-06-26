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
        messageBus.unsubscribe('/babble/topics/' + self.get('currentTopicId') + '/notifications')
      }
      self.set('currentTopicId', topic.id)
      messageBus.subscribe('/babble/topics/' + self.get('currentTopicId'), self.setCurrentTopic)
      messageBus.subscribe('/babble/topics/' + self.get('currentTopicId') + '/posts', self.handleNewPost)
      messageBus.subscribe('/babble/topics/' + self.get('currentTopicId') + '/notifications', self.handleNotification)

      var postStream = PostStream.create(topic.post_stream)
      postStream.topic = topic
      postStream.updateFromJson(topic.post_stream)

      topic.postStream = postStream
      topic.notifications = {}
    } else {
      topic.postStream = self.get('currentTopic.postStream')
      topic.notifications = self.get('currentTopic.notifications')
    }

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
      self.set('loadingEditId', null)
      self.toggleProperty('queueRerender')
    } else {
      post.set('created_at', data.created_at)
      self.set('latestPost', post)

      if (self.lastPostIsMine()) {
        self.clearStagedPost()
        postStream.commitPost(post)
        self.set('unreadCount', 0)
        Discourse.Babble.set('submitDisabled', false)
      } else {
        postStream.appendPost(post)
        var topic = self.get('currentTopic')
      }
      self.toggleProperty('postStreamUpdated')
    }
  },

  handleNotification: function (data) {
    const notifications = Discourse.Babble.get('currentTopic.notifications')
    const username = data.user.username
    data.user.template = data.user.avatar_template
    if (notifications[username]) {
      clearTimeout(notifications[username].timeout)
    }
    notifications[username] = data
    data.timeout = setTimeout(function () {
      delete notifications[username]
    }, 30 * 1000)
  },

  clearStagedPost: function() {
    const self = Discourse.Babble
    var postStream = self.get('currentTopic.postStream')
    var staged = postStream.findLoadedPost(-1)
    if (staged) { postStream.removePosts([staged]) }
  }
})
