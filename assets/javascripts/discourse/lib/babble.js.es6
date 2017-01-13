import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'
import elementIsVisible from '../lib/element-is-visible'
import lastVisibleElement from '../lib/last-visible-element'
import debounce from 'discourse/lib/debounce'
import setupComposer from '../lib/setup-composer'
import autosize from 'discourse/lib/autosize'
import resizeChat from '../lib/resize-chat'
import { ajax } from 'discourse/lib/ajax'

export default Ember.Object.create({
  availableTopics: [],

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
      topic.presence = {}
    } else {
      topic.postStream = this.get('currentTopic.postStream')
      topic.presence = this.get('currentTopic.presence')
    }

    this.set('currentTopic', topic)
    this.setPostRange()
    this.set('latestPost', _.max(topic.postStream.posts, function(p) { return p.post_number }))
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
      messageBus.unsubscribe(apiPath(currentTopicId), 'presence')
    }
    messageBus.subscribe(apiPath(topicId),             (data) => { this.setCurrentTopic(data) })
    messageBus.subscribe(apiPath(topicId, 'posts'),    (data) => { this.handleNewPost(data) })
    messageBus.subscribe(apiPath(topicId, 'presence'), (data) => { this.handlePresence(data) })
  },

  prepareScrollContainer(container) {
    if (!container.length) { return }

    // Set up scroll listener
    var lastScroll = 0
    var self = this
    $(container).on('scroll.discourse-babble-scroll', debounce(function(e) {
      // detect direction of scroll
      var scroll = $(this).scrollTop();
      let direction = scroll > lastScroll ? 'next' : 'previous'
      lastScroll = scroll

      self.readLastVisiblePost()
      self.loadPosts(direction)
    }, 500))
    $(container).trigger('scroll.discourse-babble-scroll')

    // Mark scroll container as activated
    container.attr('scroll-container', 'active')
    this.set('scrollContainer', container)
  },

  initialScroll(scrollToPost) {
    const topic = this.currentTopic
    const container = this.get('scrollContainer')
    if (!topic || !container) {return}

    this.scrollTo(scrollToPost || topic.last_read_post_number, 0)
  },

  readLastVisiblePost() {
    let postNumber = lastVisibleElement(this.get('scrollContainer'), '.babble-post', 'post-number')
    if (postNumber <= this.get('currentTopic.last_read_post_number')) { return }
    ajax(`/babble/topics/${this.get('currentTopic.id')}/read/${postNumber}.json`).then((data) => {
      this.setCurrentTopic(data)
    })
  },

  loadPosts(direction) {
    if (!elementIsVisible(this.get('scrollContainer'), $(`.babble-pressure-plate.${direction}`))) { return }
    this.set('loadingPosts', direction)
    this.rerender()

    let firstLoadedPostNumber = this.get('firstLoadedPostNumber')
    let lastLoadedPostNumber = this.get('lastLoadedPostNumber')
    let postNumber = direction === 'previous' ? firstLoadedPostNumber : lastLoadedPostNumber

    ajax(`/babble/topics/${this.get('currentTopic.id')}/posts/${postNumber}/${direction}`).then((data) => {
      // NB: these are wrapped in a 'topics' root and I don't know why.
      let newPosts = data.topics.map(function(post) { return Post.create(post) })
      let currentPosts = this.get('currentTopic.postStream.posts')
      this.set('currentTopic.postStream.posts', newPosts.concat(currentPosts))
      this.setPostRange()
    }).finally(() => {
      this.set('loadingPosts', null)
      this.rerender()
    })
  },

  setPostRange() {
    const postNumbers = this.get('currentTopic.postStream.posts').map(function(post) { return post.post_number })
    this.setProperties({
      'firstLoadedPostNumber': _.min(postNumbers),
      'lastLoadedPostNumber': _.max(postNumbers)
    })
  },

  prepareComposer(textarea) {
    if (!textarea.length) { return }
    setupComposer(textarea, { mentions: true, emojis: true, topicId: this.currentTopic.id })
    textarea.attr('babble-composer', 'active')
  },

  setupAfterRender(scrollToPost) {
    Ember.run.scheduleOnce('afterRender', () => {
      const $scrollContainer = $('.babble-list[scroll-container=inactive]')
      this.prepareScrollContainer($scrollContainer)
      this.initialScroll(scrollToPost)

      const $textarea = $('.babble-post-composer textarea[babble-composer=inactive]')
      this.prepareComposer($textarea)

      const $editing = $('.babble-post-composer textarea[babble-composer=active]')
      autosize($editing)
      resizeChat()
    })
  },

  resetComposer() {
    let evt = document.createEvent('Event'),
        ele = $('.babble-post-composer textarea[babble-composer=active]')[0];
    evt.initEvent('autosize:update', true, false);
    ele.dispatchEvent(evt);
  },

  setAvailableTopics(data) {
    this.set('availableTopics', (data || {}).topics || [])
  },

  getAvailableTopics(excludeCurrent) {
    return this.get('availableTopics').filter((topic) => {
      return !excludeCurrent || topic.id !== this.get('currentTopic.id')
    })
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
    if (!Discourse.User.current()) { return false }
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
    this.resetComposer()
    this.rerender()
  },

  handleNewPost(data) {
    let postStream     = this.get('currentTopic.postStream'),
        performScroll  = false

    if (data.topic_id != this.get('currentTopic.id')) { return }

    this.set(`currentTopic.presence.${data.username}`, null)

    if (!Discourse.User.current() || data.user_id != Discourse.User.current().id) {
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
    if(performScroll) {
      this.scrollTo(post.post_number)
      this.set('unreadCount', 0)
    }
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

  handlePresence(data) {
    if (Discourse.User.current() && data.id == Discourse.User.current().id) { return }
    this.get('currentTopic.presence')[data.username] = moment()
    this.rerender()
  },

  clearStagedPost() {
    var postStream = this.get('currentTopic.postStream')
    var staged = postStream.findLoadedPost(-1)
    if (staged) { postStream.removePosts([staged]) }
  },

  rerender() {
    const header = this.get('header')
    const container = this.get('container')
    if (header) {header.queueRerender()}
    if (container) {container.queueRerender()}
  }
})
