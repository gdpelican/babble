import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'
import lastVisibleElement from '../lib/last-visible-element'
import debounce from 'discourse/lib/debounce'

export default Ember.Object.create({

  disabled: function() {
    return _.contains(Discourse.Site.current().disabled_plugins, 'babble')
  },

  setCurrentTopic: function(data) {
    if (!data.id) {
      this.set('currentTopic', null)
      this.set('currentTopicId', null)
      this.set('latestPost', null)
      this.set('scrollContainer', null)
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

    this.set('currentTopic', topic)
    this.set('latestPost', _.last(topic.postStream.posts))
    this.setUnreadCount()
    this.rerender()
  },

  editPost(post) {
    if (!post) {
      this.set('editingPostId', null)
    } else {
      this.set('editingPostId', post.id)
      this.scrollTo(post.post_number)
    }
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

  setScrollContainer: function(scrollContainer) {
    // Set up scroll listener
    $(scrollContainer).on('scroll.discourse-babble-scroll', debounce((e) => {
      let postNumber = lastVisibleElement(scrollContainer, '.babble-post', 'post-number')
      if (postNumber <= this.get('currentTopic.last_read_post_number')) { return }
      Discourse.ajax(`/babble/topics/${this.get('currentTopicId')}/read/${postNumber}.json`).then((data) => {
        this.setCurrentTopic(data)
      })
    }, 500))

    // Mark scroll container as activated
    scrollContainer.attr('scroll-container', 'active')
    this.set('scrollContainer', scrollContainer)
  },

  setAvailableTopics: function(data) {
    this.set('availableTopics', (data || {}).topics || [])
  },

  setUnreadCount: function() {
    if (this.lastPostIsMine()) {
      var unreadCount       = 0,
          additionalUnread  = false
    } else {
      var totalUnreadCount  = this.get('latestPost.post_number') - this.get('currentTopic.last_read_post_number'),
          windowUnreadCount = _.min([totalUnreadCount, this.get('currentTopic.postStream.posts.length')]),
          unreadCount       = windowUnreadCount,
          additionalUnread  = totalUnreadCount > windowUnreadCount
    }
    this.set('unreadCount', unreadCount)
    this.set('hasAdditionalUnread', additionalUnread)
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
    this.scrollTo(this.get('latestPost.post_number'))
    this.set('latestPost', post)
    this.rerender()
  },

  handleNewPost: function(data) {
    let postStream     = this.get('currentTopic.postStream'),
        performScroll  = false

    if (data.user_id != Discourse.User.current().id) {
      _.each(['can_edit', 'can_delete'], function(key) { delete data[key] })
    }

    let post = Post.create(data)

    if (data.is_edit || data.is_delete) {
      postStream.storePost(post)
      postStream.findLoadedPost(post.id).updateFromPost(post)
      this.set('loadingEditId', null)
    } else {
      performScroll = lastVisibleElement(this.get('scrollContainer'), '.babble-post', 'post-number') ==
                      this.get('latestPost.post_number')

      post.set('created_at', data.created_at)
      this.set('latestPost', post)

      if (this.lastPostIsMine()) {
        this.clearStagedPost()
        postStream.commitPost(post)
      } else {
        postStream.appendPost(post)
      }

    }
    this.setUnreadCount()
    this.rerender()
    if(performScroll) { this.scrollTo(post.post_number) }
  },

  scrollTo(postNumber, speed = 400) {
    Ember.run.scheduleOnce('afterRender', () => {
      let container = this.get('scrollContainer')
      if (!container.length) { return }

      let post      = container.find(`.babble-post[data-post-number=${postNumber}]`)
      if (!post.length) { return }

      container.animate({ scrollTop: post.position().top }, speed)

      let input = post.find('textarea')
      if (input) { input.focus() }
    })
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
