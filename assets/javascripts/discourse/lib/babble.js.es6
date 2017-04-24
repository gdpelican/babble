import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'
import elementIsVisible from '../lib/element-is-visible'
import lastVisibleElement from '../lib/last-visible-element'
import debounce from 'discourse/lib/debounce'
import { ajax } from 'discourse/lib/ajax'
import { applyBrowserHacks, scrollToPost, setupResize, teardownResize, setupScrollContainer, setupComposer, teardownComposer, hasChatElements } from '../lib/chat-element-utils'
import { syncWithPostStream, latestPostFor, latestPostIsMine, setupPresence, teardownPresence, setupLastReadMarker } from '../lib/chat-topic-utils'
import { forEachTopicContainer } from '../lib/chat-topic-iterators'
import { rerender } from '../lib/chat-component-utils'
import { setupLiveUpdate, teardownLiveUpdate } from '../lib/chat-live-update-utils'
import BabbleRegistry from '../lib/babble-registry'

export default Ember.Object.create({

  disabled() {
    return _.contains(Discourse.Site.current().disabled_plugins, 'babble')
  },

  bindById(component, topicId) {
    return this.loadTopic(topicId).then((topic) => {
      return this.bind(component, topic)
    }, console.log)
  },

  bind(component, topic) {
    if (!topic) { return }

    this.unbind(component)
    topic = BabbleRegistry.bind(component, topic)

    Ember.run.scheduleOnce('afterRender', () => {
      setupLastReadMarker(topic)
      setupLiveUpdate(topic, {
        '':       ((data) => { this.buildTopic(data) }),
        'posts':  ((data) => { this.handleNewPost(topic, data) }),
        'typing': ((data) => { this.handleTyping(topic, data) }),
        'online': ((data) => { this.handleOnline(topic, data) })
      })

      if (hasChatElements(component.element)) {
        if (component.fullpage) { setupResize(topic) }
        setupScrollContainer(topic)
        setupPresence(topic)
        setupComposer(topic)
        scrollToPost(topic, topic.last_read_post_number, 0)
        applyBrowserHacks(topic)
      }
      rerender(topic)
    })
    return topic
  },

  unbind(component) {
    let topic = BabbleRegistry.topicForComponent(component)
    if (!topic) { return }

    teardownLiveUpdate(topic, '', 'posts', 'typing', 'online')

    if (hasChatElements(component.element)) {
      if (component.fullpage) { teardownResize(topic) }
      teardownPresence(topic)
    }
    BabbleRegistry.unbind(component)
  },

  loadTopic(id) {
    this.set('loadingTopicId', id)
    return ajax(`/babble/topics/${id}.json`).then((data) => {
      return this.buildTopic(data)
    }).finally(() => {
      this.set('loadingTopicId', null)
    })
  },

  topicForComponent(component) {
    return BabbleRegistry.topicForComponent(component)
  },

  buildTopic(data) {
    if (!data.id) { return }

    let topic = Topic.create(data)
    let postStream = PostStream.create(topic.post_stream)
    postStream.topic = topic
    postStream.updateFromJson(topic.post_stream)
    topic.postStream = postStream
    topic.typing = {}
    topic.online = {}

    syncWithPostStream(topic)
    return topic
  },

  createPost(topic, text) {
    this.stagePost(topic, text)
    return ajax(`/babble/topics/${topic.id}/posts`, {
      type: 'POST',
      data: { raw: text }
    }).then((data) => {
      this.handleNewPost(topic, data)
    })
  },

  editPost(topic, post) {
    if (post) {
      topic.set('editingPostId', post.id)
      scrollToPost(topic, post.post_number)
      setupComposer(topic)
    } else {
      topic.set('editingPostId', null)
    }
  },

  updatePost(topic, post, text) {
    this.editPost(topic, null)
    topic.set('loadingEditId', post.id)
    return ajax(`/babble/topics/${post.topic_id}/posts/${post.id}`, {
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
    return ajax(`/babble/topics/${post.topic_id}/posts/${post.id}`, {
      type: 'DELETE'
    }).finally(() => {
      topic.set('loadingEditId', null)
    })
  },

  handleNewPost(topic, data) {
    if (data.topic_id != topic.id) { return }

    delete topic.typing[data.username]

    if (!Discourse.User.current() || data.user_id != Discourse.User.current().id) {
      _.each(['can_edit', 'can_delete'], function(key) { delete data[key] })
    }

    let post = Post.create(data)

    if (data.is_edit || data.is_delete) {
      topic.postStream.storePost(post)
    } else {

      let performScroll = _.any(forEachTopicContainer(topic, function($container) {
        return lastVisibleElement($container.find('.babble-chat'), '.babble-post', 'post-number') == topic.lastLoadedPostNumber
      }))

      if (latestPostIsMine(topic)) {
        // clear staged post
        let staged =  topic.postStream.findLoadedPost(-1)
        if (staged) { topic.postStream.removePosts([staged]) }
        topic.postStream.commitPost(post)
      } else {
        if (performScroll) { topic.set('last_read_post_number', post.post_number) }
        topic.postStream.appendPost(post)
      }

      if (performScroll) { scrollToPost(topic, post.post_number) }
    }

    syncWithPostStream(topic)
  },

  handleTyping(topic, data) {
    if (Discourse.User.current() && data.id == Discourse.User.current().id) { return }
    topic.typing[data.username] = { user: data, lastTyped: moment() }
    rerender(topic)
  },

  handleOnline(topic, data) {
    if (Discourse.User.current() && data.id == Discourse.User.current().id) { return }
    topic.online[data.username] = { user: data, lastSeen: moment() }
    rerender(topic)
  },

  loadPosts(topic, order) {
    topic.set('loadingPosts', order)
    rerender(topic)
    let starterPostField = order === 'desc' ? 'firstLoadedPostNumber' : 'lastLoadedPostNumber'
    let postNumber = topic.get(starterPostField)

    return ajax(`/babble/topics/${topic.id}/posts/${postNumber}/${order}`).then((data) => {
      data.posts.map(function(post) { topic.postStream.appendPost(Post.create(post)) })
      syncWithPostStream(topic)
      scrollToPost(topic, topic.get(starterPostField))
    }).finally(() => {
      topic.set('loadingPosts', null)
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
      admin:              user.get('admin'),
      created_at:         moment()
    })
    topic.postStream.stagePost(post, user)
    topic.set('lastLoadedPostNumber', post.post_number)
    scrollToPost(topic, post.post_number)
    teardownComposer(topic)
    rerender(topic)
  }
})
