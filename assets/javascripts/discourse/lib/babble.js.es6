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

  buildTopic(data, previousTopic) {
    if (!data.id) {
      this.set('scrollContainer', null)
      return
    }

    var resetTopicField = (topic, field) => {
      topic[field] = data[field]
      if (topic[field] == null && previousTopic) { topic[field] = previousTopic[field] }
    }

    var topic = Topic.create(data)
    resetTopicField(topic, 'last_read_post_number')
    resetTopicField(topic, 'highest_post_number')

    if (previousTopic && previousTopic.id == topic.id) {
      topic.postStream = previousTopic.postStream
      topic.presence   = previousTopic.presence
    } else {
      this.handleMessageBusSubscriptions(topic, previousTopic)

      let postStream = PostStream.create(topic.post_stream)
      postStream.topic = topic
      postStream.updateFromJson(topic.post_stream)

      topic.postStream = postStream
      topic.presence = {}
    }

    this.setPostRange(topic)
    this.setUnreadCount(topic)
    return topic
  },

  latestPostFor(topic) {
    return _.max(topic.postStream.posts, function(p) { return p.post_number })
  },

  createPost(topic, text) {
    this.stagePost(topic, text)
    return ajax(`/babble/topics/${topic.id}/post`, {
      type: 'POST',
      data: { raw: text }
    }).then((data) => {
      this.handleNewPost(topic, data)
    })
  },

  loadTopic(id) {
    this.set('loadingTopicId', id)
    return ajax(`/babble/topics/${id}.json`).finally(() => { this.set('loadingTopicId', null) })
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

  updatePost(post, topic, text) {
    this.editPost(null)
    this.set('loadingEditId', post.id)
    ajax(`/babble/topics/${post.topic_id}/post/${post.id}`, {
      type: 'POST',
      data: { raw: text }
    }).then((data) => {
      this.handleNewPost(topic, data)
    }).finally(() => {
      this.set('loadingEditId', null)
    })
  },

  destroyPost(post) {
    this.set('loadingEditId', post.id)
    ajax(`/babble/topics/${post.topic_id}/destroy/${post.id}`, {
      type: 'DELETE'
    }).finally(() => {
      this.set('loadingEditId', null)
    })
  },

  handleMessageBusSubscriptions(newTopic, oldTopic) {
    if (oldTopic && newTopic && oldTopic.id == newTopic.id) { return }
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    let apiPath = function(topic, action) { return `/babble/topics/${topic.id}/${action}` }

    if (oldTopic) {
      messageBus.unsubscribe(apiPath(oldTopic))
      messageBus.unsubscribe(apiPath(oldTopic), 'posts')
      messageBus.unsubscribe(apiPath(oldTopic), 'presence')
    }
    messageBus.subscribe(apiPath(newTopic),             (data) => { this.buildTopic(data) })
    messageBus.subscribe(apiPath(newTopic, 'posts'),    (data) => { this.handleNewPost(newTopic, data) })
    messageBus.subscribe(apiPath(newTopic, 'presence'), (data) => { this.handlePresence(newTopic, data) })
  },

  prepareScrollContainer(topic, container) {
    if (!container.length) { return }

    // Set up scroll listener
    let lastScroll = 0
    $(container).on('scroll.discourse-babble-scroll', debounce((e) => {
      // detect direction of scroll
      let scroll = $(this).scrollTop();
      let direction = scroll > lastScroll ? 'next' : 'previous'
      lastScroll = scroll

      this.readLastVisiblePost(topic)
      this.loadPosts(direction)
    }, 500))
    $(container).trigger('scroll.discourse-babble-scroll')

    // Mark scroll container as activated
    container.attr('scroll-container', 'active')
    this.set('scrollContainer', container)
  },

  initialScroll(topic, scrollToPost) {
    const container = this.get('scrollContainer')
    if (!topic || !container) {return}

    this.scrollTo(scrollToPost || topic.last_read_post_number, 0)
  },

  readLastVisiblePost(topic) {
    let postNumber = lastVisibleElement(this.get('scrollContainer'), '.babble-post', 'post-number')
    if (postNumber <= topic.last_read_post_number) { return }
    return ajax(`/babble/topics/${topic.id}/read/${postNumber}.json`)
  },

  loadPosts(topic, direction) {
    if (!elementIsVisible(this.get('scrollContainer'), $(`.babble-pressure-plate.${direction}`))) { return }
    this.set('loadingPosts', direction)
    this.rerender()
    let starterPostField = direction === 'previous' ? 'firstLoadedPostNumber' : 'lastLoadedPostNumber'
    let postNumber = topic.get(starterPostField)

    ajax(`/babble/topics/${topic.id}/posts/${postNumber}/${direction}`).then((data) => {
      // NB: these are wrapped in a 'topics' root and I don't know why.
      let newPosts = data.topics.map(function(post) { return Post.create(post) })
      let currentPosts = topic.postStream.posts
      topic.set('postStream.posts', newPosts.concat(currentPosts))
      this.setPostRange(topic)
    }).finally(() => {
      this.set('loadingPosts', null)
      this.rerender()
    })
  },

  setPostRange(topic) {
    const postNumbers = topic.postStream.posts.map(function(post) { return post.post_number })
    topic.set('firstLoadedPostNumber', _.min(postNumbers))
    topic.set('lastLoadedPostNumber',  _.max(postNumbers))
  },

  prepareComposer(topic, textarea) {
    if (!textarea.length) { return }
    setupComposer(textarea, { mentions: true, emojis: true, topicId: topic.id })
    textarea.attr('babble-composer', 'active')
  },

  setupAfterRender(topic, scrollToPost) {
    Ember.run.scheduleOnce('afterRender', () => {
      const $scrollContainer = $('.babble-list[scroll-container=inactive]')
      this.prepareScrollContainer(topic, $scrollContainer)
      this.initialScroll(topic, scrollToPost)

      const $textarea = $('.babble-post-composer textarea[babble-composer=inactive]')
      this.prepareComposer(topic, $textarea)

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

  setUnreadCount(topic) {
    let unreadCount = 0
    let additionalUnread = false
    if (!this.latestPostIsMine(topic)) {
      let totalUnreadCount  = this.latestPostFor(topic).post_number - topic.last_read_post_number
      let windowUnreadCount = _.min([totalUnreadCount, topic.postStream.posts.length])
      let unreadCount       = windowUnreadCount
      let additionalUnread  = totalUnreadCount > windowUnreadCount
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

  latestPostIsMine(topic) {
    let latestPost  = this.latestPostFor(topic)
    let currentUser = Discourse.User.current()
    if (!currentUser || !latestPost) { return false }
    return latestPost.user_id == currentUser.id
  },

  stagePost(topic, text) {
    const user = Discourse.User.current()

    let post = Post.create({
      raw:                text,
      cooked:             text,
      name:               user.get('name'),
      display_username:   user.get('name'),
      username:           user.get('username'),
      user_id:            user.get('id'),
      user_title:         user.get('title'),
      avatar_template:    user.get('avatar_template'),
      user_custom_fields: user.get('custom_fields'),
      moderator:          user.get('moderator'),
      admin:              user.get('admin')
    })
    topic.set('isStaging', true)
    topic.postStream.set('loadedAllPosts', true)
    topic.postStream.stagePost(post, user)
    this.scrollTo(post.post_number)
    this.resetComposer()
    this.rerender()
  },

  handleNewPost(topic, data) {
    let performScroll  = false

    if (data.topic_id != topic.id) { return }

    topic.set(`presence.${data.username}`, null)

    if (!Discourse.User.current() || data.user_id != Discourse.User.current().id) {
      _.each(['can_edit', 'can_delete'], function(key) { delete data[key] })
    }

    let post = Post.create(data)

    if (data.is_edit || data.is_delete) {
      topic.postStream.storePost(post)
      topic.postStream.findLoadedPost(post.id).updateFromPost(post)
      this.set('loadingEditId', null)
    } else {
      performScroll = lastVisibleElement(this.get('scrollContainer'), '.babble-post', 'post-number') ==
                      this.get('latestPost.post_number')

      post.set('created_at', data.created_at)

      if (this.latestPostIsMine(topic)) {
        this.clearStagedPost(topic)
        topic.postStream.commitPost(post)
      } else {
        topic.postStream.appendPost(post)
      }

    }
    this.setPostRange(topic)
    this.setUnreadCount(topic)
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

  handlePresence(topic, data) {
    if (Discourse.User.current() && data.id == Discourse.User.current().id) { return }
    topic.set(`presence.${data.username}`, moment())
    this.rerender()
  },

  clearStagedPost(topic) {
    let staged = topic.postStream.findLoadedPost(-1)
    if (staged) { topic.postStream.removePosts([staged]) }
  },

  rerender() {
    const header = this.get('header')
    const container = this.get('container')
    if (header) {header.queueRerender()}
    if (container) {container.queueRerender()}
  }
})
