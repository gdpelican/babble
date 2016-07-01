import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'

export default Ember.Object.create({

  disabled: function() {
    return _.contains(Discourse.Site.current().disabled_plugins, 'babble')
  },

  setCurrentTopic: function(data) {
    if (!data.id) {
      this.set('currentTopic', null)
      this.set('currentTopicId', null)
      this.set('latestPost', null)
      return
    }

    var resetTopicField = (topic, field) => {
      topic[field] = data[field]
      if (!topic[field] && this.get('currentTopic')) { topic[field] = this.get('currentTopic')[field] }
    }

    var topic = Topic.create(data)
    resetTopicField(topic, 'last_read_post_number')
    resetTopicField(topic, 'highest_post_number')

    if (this.get('currentTopicId') != topic.id) {
      this.handleMessageBusSubscriptions(topic.id)
      this.set('currentTopicId', topic.id)

      let postStream = PostStream.create(topic.post_stream)
      postStream.topic = topic
      postStream.updateFromJson(topic.post_stream)

      topic.postStream = postStream
      topic.notifications = {}
    } else {
      topic.postStream = this.get('currentTopic.postStream')
      topic.notifications = this.get('currentTopic.notifications')
    }

    var totalUnreadCount = topic.highest_post_number - topic.last_read_post_number
    var windowUnreadCount = _.min([totalUnreadCount, topic.postStream.posts.length])

    this.set('unreadCount', windowUnreadCount)
    this.set('hasAdditionalUnread', totalUnreadCount > windowUnreadCount)
    this.set('currentTopic', topic)
    this.rerender()
  },

  handleMessageBusSubscriptions(topicId) {
    if (this.get('currentTopicId') == topicId) { return }
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    let apiPath = function(topicId, action) { return `/babble/topics/${topicId}/${action}` }

    if (this.currentTopicId) {
      messageBus.unsubscribe(apiPath(this.currentTopicId))
      messageBus.unsubscribe(apiPath(this.currentTopicId), 'posts')
      messageBus.unsubscribe(apiPath(this.currentTopicId), 'notifications')
    }
    messageBus.subscribe(apiPath(topicId),                  (data) => { this.setCurrentTopic(data) })
    messageBus.subscribe(apiPath(topicId, 'posts'),         (data) => { this.handleNewPost(data) })
    messageBus.subscribe(apiPath(topicId, 'notifications'), (data) => { this.handleNotification(data) })
  },

  setAvailableTopics: function(data) {
    this.set('availableTopics', (data || {}).topics || [])
  },

  lastPostIsMine: function() {
    return this.get('latestPost.user_id') == Discourse.User.current().id
  },

  stagePost: function(text) {
    const user = Discourse.User.current()

    var postStream = this.get('currentTopic.postStream')
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
    this.set('latestPost', post)
  },

  handleNewPost: function(data) {
    let postStream = this.get('currentTopic.postStream')
    if (data.user_id != Discourse.User.current().id) {
      _.each(['can_edit', 'can_delete'], function(key) { delete data[key] })
    }

    let post = Post.create(data)

    if (data.is_edit || data.is_delete) {
      postStream.storePost(post)
      postStream.findLoadedPost(post.id).updateFromPost(post)
      this.set('loadingEditId', null)
    } else {
      post.set('created_at', data.created_at)
      this.set('latestPost', post)

      if (this.lastPostIsMine()) {
        this.clearStagedPost()
        postStream.commitPost(post)
        this.set('unreadCount', 0)
      } else {
        postStream.appendPost(post)
        var topic = this.get('currentTopic')
      }
    }
    this.rerender()
  },

  handleNotification: function (data) {
    const notifications = this.get('currentTopic.notifications')
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
    var postStream = this.get('currentTopic.postStream')
    var staged = postStream.findLoadedPost(-1)
    if (staged) { postStream.removePosts([staged]) }
  },

  rerender() {
    if (!this.get('header')) { return }
    this.get('header').queueRerender()
  }
})
