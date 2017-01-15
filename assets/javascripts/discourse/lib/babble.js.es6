import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'
import elementIsVisible from '../lib/element-is-visible'
import lastVisibleElement from '../lib/last-visible-element'
import debounce from 'discourse/lib/debounce'
import autosize from 'discourse/lib/autosize'
import { ajax } from 'discourse/lib/ajax'
import { scrollToPost, resizeChat, setupComposer, resetComposer } from '../lib/chat-element-utils'
import { syncWithPostStream, latestPostFor, latestPostIsMine } from '../lib/chat-topic-utils'
import { forEachTopicContainer } from '../lib/chat-topic-iterators'
import { rerender } from '../lib/chat-component-utils'

export default Ember.Object.create({

  disabled() {
    return _.contains(Discourse.Site.current().disabled_plugins, 'babble')
  },

  bind(component, listenForResize) {
    // Listen for window changes and adjust chat page accordingly

    Ember.run.scheduleOnce('afterRender', () => {
      let topic = component.get('topic')
      if (!topic) { return }

      let selector = component.get('selector')
      if (!selector) { console.log("WARN: you initialized a babble component without setting the 'selector' prop on the component. Chat will likely be broken in this component!") }

      let currentComponents = topic.get('babbleComponents') || []
      topic.set('babbleComponents', currentComponents.concat(component))

      const $container = this.prepareScrollContainer(topic, $(selector).find('.babble-chat[scroll-container=inactive]'))
      const $editing   = $($container).find('.babble-post-composer textarea[babble-composer=active]')

      if (listenForResize) {
        $(window).on(`resize.babble-${topic.id}`, _.debounce(function() { resizeChat(topic) }, 250))
        resizeChat(topic)
      }

      if (topic.last_read_post_number < topic.highest_post_number) {
        topic.set('lastReadMarker', topic.last_read_post_number)
      } else {
        topic.set('lastReadMarker', null)
      }

      setupComposer(topic, { mentions: true, emojis: true, topicId: topic.id })
      autosize($editing)
      scrollToPost(topic, topic.last_read_post_number, 0)
      rerender(topic)
    })
  },

  unbind(component) {
    let topic = component.get('topic')
    if (!topic) { return }


    topic.set('babbleComponents', (topic.get('babbleComponents') || []).without(component))
    // TODO: what else needs to be done to unbind?
    $(window).off(`resize.babble-${topic.id}`)
  },

  loadTopic(id) {
    this.set('loadingTopicId', id)
    return ajax(`/babble/topics/${id}.json`).finally(() => { this.set('loadingTopicId', null) })
  },

  buildTopic(data, previousTopic) {
    if (!data.id) { return }

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

    syncWithPostStream(topic)
    return topic
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

  editPost(topic, post) {
    if (!post) {
      topic.set('editingPostId', null)
      $('.babble-post-composer textarea').focus()
    } else {
      topic.set('editingPostId', post.id)
      scrollToPost(topic, post.post_number)
    }
  },

  updatePost(topic, post, text) {
    this.editPost(topic, null)
    topic.set('loadingEditId', post.id)
    ajax(`/babble/topics/${post.topic_id}/post/${post.id}`, {
      type: 'POST',
      data: { raw: text }
    }).then((data) => {
      this.handleNewPost(topic, data)
    }).finally(() => {
      topic.set('loadingEditId', null)
    })
  },

  destroyPost(topic, post) {
    topic.set('loadingEditId', post.id)
    ajax(`/babble/topics/${post.topic_id}/destroy/${post.id}`, {
      type: 'DELETE'
    }).finally(() => {
      topic.set('loadingEditId', null)
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
      topic.set('loadingEditId', null)
    } else {

      let performScroll = _.any(forEachTopicContainer(topic, function($container) {
        return lastVisibleElement($container, '.babble-post', 'post-number') == latestPostFor(topic).post_number
      }))

      post.set('created_at', data.created_at)

      if (latestPostIsMine(topic)) {
        // clear staged post
        let staged =  topic.postStream.findLoadedPost(-1)
        if (staged) { topic.postStream.removePosts([staged]) }
        topic.postStream.commitPost(post)
      } else {
        topic.postStream.appendPost(post)
      }
    }

    syncWithPostStream(topic)
    rerender(topic)
    if (performScroll) { scrollToPost(topic, post.post_number) }

    return post
  },

  handlePresence(topic, data) {
    if (Discourse.User.current() && data.id == Discourse.User.current().id) { return }
    topic.set(`presence.${data.username}`, moment())
    rerender(topic)
  },

  prepareScrollContainer(topic, $container) {
    if (!$container) { return }

    // Set up scroll listener
    let lastScroll = 0
    $($container).on('scroll.discourse-babble-scroll', debounce((e) => {
      // detect direction of scroll
      let scroll = $(this).scrollTop();
      let order = scroll > lastScroll ? 'asc' : 'desc'
      lastScroll = scroll

      this.readLastVisiblePost(topic, $container)
      this.loadPosts(topic, order)
    }, 500))
    $($container).trigger('scroll.discourse-babble-scroll')

    // Mark scroll container as activated
    $container.attr('scroll-container', 'active')
    return $container
  },

  readLastVisiblePost(topic, $container) {
    let postNumber = lastVisibleElement($container, '.babble-post', 'post-number')
    if (postNumber <= topic.last_read_post_number) { return }
    return ajax(`/babble/topics/${topic.id}/read/${postNumber}.json`)
  },

  loadPosts(topic, order) {
    topic.set('loadingPosts', order)
    rerender(topic)
    let starterPostField = order === 'desc' ? 'firstLoadedPostNumber' : 'lastLoadedPostNumber'
    let postNumber = topic.get(starterPostField)

    ajax(`/babble/topics/${topic.id}/posts/${postNumber}/${order}`).then((data) => {
      // NB: these are wrapped in a 'topics' root and I don't know why.
      let newPosts = data.topics.map(function(post) { return Post.create(post) })
      let currentPosts = topic.postStream.posts
      topic.set('postStream.posts', newPosts.concat(currentPosts))
      syncWithPostStream(topic)
      scrollToPost(topic, topic.get(starterPostField))
    }).finally(() => {
      topic.set('loadingPosts', null)
      rerender(topic)
    })
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
    topic.set('lastLoadedPostNumber', post.post_number)
    scrollToPost(topic, post.post_number)
    resetComposer(topic)
    rerender(topic)
  }
})
