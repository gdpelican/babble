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

    var resetTopicField = function(topic, field) {
      topic[field] = data[field]
      if (!topic[field] && this.get('currentTopic')) { topic[field] = this.get('currentTopic')[field] }
    }

    var topic = Topic.create(data)
    resetTopicField(topic, 'last_read_post_number')
    resetTopicField(topic, 'highest_post_number')

    if (this.get('currentTopicId') != topic.id) {
      const messageBus = Discourse.__container__.lookup('message-bus:main')
      if (this.get('currentTopicId')) {
        messageBus.unsubscribe('/babble/topics/' + this.get('currentTopicId'))
        messageBus.unsubscribe('/babble/topics/' + this.get('currentTopicId') + '/posts')
      }
      this.set('currentTopicId', topic.id)
      messageBus.subscribe('/babble/topics/' + this.get('currentTopicId'), this.setCurrentTopic)
      messageBus.subscribe('/babble/topics/' + this.get('currentTopicId') + '/posts', this.handleNewPost)

      var postStream = PostStream.create(topic.post_stream)
      postStream.topic = topic
      postStream.updateFromJson(topic.post_stream)

      topic.postStream = postStream
    } else {
      topic.postStream = this.get('currentTopic.postStream')
    }

    var totalUnreadCount = topic.highest_post_number - topic.last_read_post_number
    var windowUnreadCount = _.min([totalUnreadCount, topic.postStream.posts.length])

    this.set('unreadCount', windowUnreadCount)
    this.set('hasAdditionalUnread', totalUnreadCount > windowUnreadCount)
    this.set('currentTopic', topic)
  },

  setAvailableTopics: function(topics) {
    this.set('availableTopics', topics)
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
    } else {
      post.set('created_at', moment(data.created_at, 'YYYY-MM-DD HH:mm:ss Z'))
      this.set('latestPost', post)

      if (this.lastPostIsMine()) {
        this.clearStagedPost()
        postStream.commitPost(post)
        this.set('unreadCount', 0)
      } else {
        postStream.appendPost(post)
        var topic = this.get('currentTopic')
        this.set('unreadCount', topic.highest_post_number - topic.last_read_post_number)
      }
    }
  },

  clearStagedPost: function() {
    var postStream = this.get('currentTopic.postStream')
    var staged = postStream.findLoadedPost(-1)
    if (staged) { postStream.removePosts([staged]) }
  }
})
