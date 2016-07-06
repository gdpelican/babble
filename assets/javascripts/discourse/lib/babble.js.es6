import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'
import lastVisibleElement from '../lib/last-visible-element'
import debounce from 'discourse/lib/debounce'
import setupComposer from '../lib/setup-composer'

export default Ember.Object.create({

  disabled() {
    return _.contains(Discourse.Site.current().disabled_plugins, 'babble')
  },

  setCurrentTopic(data) {
    if (!data.id) {
      this.set('currentTopic', null)
      this.set('latestPost', null)
      this.set('scrollContainer', null)
      return
    }

    var resetTopicField = (topic, field) => {
      topic[field] = data[field]
      if (topic[field] == null && this.get('currentTopic')) { topic[field] = this.get('currentTopic')[field] }
    }

    var topic = Topic.create(data)
    resetTopicField(topic, 'last_read_post_number')
    resetTopicField(topic, 'highest_post_number')

    if (this.get('currentTopic.id') != topic.id) {
      this.handleMessageBusSubscriptions(topic.id)

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
      $('.babble-post-composer textarea').focus()
    } else {
      this.set('editingPostId', post.id)
      this.scrollTo(post.post_number)
    }
  },

  handleMessageBusSubscriptions(topicId) {
    if (this.get('currentTopic.id') == topicId) { return }
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    let apiPath = function(topicId, action) { return `/babble/topics/${topicId}/${action}` }
    let currentTopicId = this.get('currentTopic.id')

    if (this.get('currentTopic.id')) {
      messageBus.unsubscribe(apiPath(currentTopicId))
      messageBus.unsubscribe(apiPath(currentTopicId), 'posts')
      messageBus.unsubscribe(apiPath(currentTopicId), 'notifications')
    }
    messageBus.subscribe(apiPath(topicId),                  (data) => { this.setCurrentTopic(data) })
    messageBus.subscribe(apiPath(topicId, 'posts'),         (data) => { this.handleNewPost(data) })
    messageBus.subscribe(apiPath(topicId, 'notifications'), (data) => { this.handleNotification(data) })
  },

  prepareScrollContainer(container) {
    if (!container.length) { return }

    // Set up scroll listener
    $(container).on('scroll.discourse-babble-scroll', debounce((e) => {
      let postNumber = lastVisibleElement(container, '.babble-post', 'post-number')
      if (postNumber <= this.get('currentTopic.last_read_post_number')) { return }
      Discourse.ajax(`/babble/topics/${this.get('currentTopic.id')}/read/${postNumber}.json`).then((data) => {
        this.setCurrentTopic(data)
      })
    }, 500))
    $(container).trigger('scroll.discourse-babble-scroll')

    // Mark scroll container as activated
    container.attr('scroll-container', 'active')
    this.set('scrollContainer', container)

    // Perform initial scroll
    this.scrollTo(this.currentTopic.last_read_post_number, 0)
  },

  prepareComposer(textarea) {
    if (!textarea.length) { return }
    setupComposer(textarea, { mentions: true, emojis: true, topicId: this.currentTopic.id })
    textarea.attr('babble-composer', 'active')
  },

  setAvailableTopics(data) {
    this.set('availableTopics', (data || {}).topics || [])
  },

  setUnreadCount() {
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

  notificationCount() {
    if (!this.get('unreadCount')) { return }
    let result = this.get('unreadCount') || 0
    if (result && this.get('hasAdditionalUnread')) { result += '+' }
    return result
  },

  lastPostIsMine() {
    return this.get('latestPost.user_id') == Discourse.User.current().id
  },

  stagePost(text) {
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

  handleNewPost(data) {
    let postStream     = this.get('currentTopic.postStream'),
        performScroll  = false

    if (data.topic_id != this.get('currentTopic.id')) { return }

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

  scrollTo(postNumber, speed = 400, offset = 30) {
    Ember.run.scheduleOnce('afterRender', () => {
      let container = this.get('scrollContainer')
      if (!container.length) { return }

      let post = container.find(`.babble-post[data-post-number=${postNumber}]`)
      if (!post.length) { return }

      let animateTarget = post.position().top + container.scrollTop() - offset
      container.animate({ scrollTop: animateTarget }, speed)
    })
  },

  handleNotification(data) {
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

  clearStagedPost() {
    var postStream = this.get('currentTopic.postStream')
    var staged = postStream.findLoadedPost(-1)
    if (staged) { postStream.removePosts([staged]) }
  },

  rerender() {
    if (!this.get('header')) { return }
    this.get('header').queueRerender()
  }
})
