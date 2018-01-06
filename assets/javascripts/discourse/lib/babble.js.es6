import Post from 'discourse/models/post'
import PostStream from 'discourse/models/post-stream'
import Topic from 'discourse/models/topic'
import elementIsVisible from '../lib/element-is-visible'
import lastVisibleElement from '../lib/last-visible-element'
import debounce from 'discourse/lib/debounce'
import { ajax } from 'discourse/lib/ajax'
import { applyBrowserHacks, scrollToPost, setupScrollContainer, setupComposer, teardownComposer, hasChatElements } from '../lib/chat-element-utils'
import { syncWithPostStream, latestPostFor, latestPostIsMine, setupPresence, teardownPresence, setupLastReadMarker } from '../lib/chat-topic-utils'
import { forEachTopicContainer } from '../lib/chat-topic-iterators'
import { rerender } from '../lib/chat-component-utils'
import { setupLiveUpdate, teardownLiveUpdate, updateUnread } from '../lib/chat-live-update-utils'
import BabbleRegistry from '../lib/babble-registry'
import showModal from 'discourse/lib/show-modal'

export default Ember.Object.create({

  disabled() {
    return _.contains(Discourse.Site.current().disabled_plugins, 'babble')
  },

  bindById(component, topicId) {
    return this.loadTopic(topicId).then((topic) => {
      return this.bind(component, topic)
    }, console.log)
  },

  bind(component, topic, toPost) {
    if (!topic) { return }

    toPost = toPost || topic.last_read_post_number

    const previous = BabbleRegistry.topicForComponent(component)
    if (previous) { teardownLiveUpdate(previous, 'posts') }

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
        setupScrollContainer(topic)
        setupPresence(topic)
        setupComposer(topic)
        scrollToPost(topic, toPost, 0)
        applyBrowserHacks(topic)
      }
    })

    updateUnread(topic)
    rerender(topic)
    return topic
  },

  unbind(component) {
    let topic = BabbleRegistry.topicForComponent(component)
    if (!topic) { return }

    // NB we don't tear down the post listener here!
    // This is only swapped out once a new topic is bound
    teardownLiveUpdate(topic, '', 'typing', 'online')

    if (hasChatElements(component.element)) {
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

  flagPost(topic, post) {
    if (post.get('actions_summary')) {
      showModal('flag', { model: post, babble: true })
    } else {
      // we have to get some more info from the API before we can properly display the flag modal
      ajax(`/posts/${post.id}`).then((data) => {
        data = Post.munge(data)
        post.set('actionByName', data.actionByName)
        post.set('actions_summary', data.actions_summary)
        showModal('flag', { model: post, babble: true })
      })
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

  populatePermissions(data) {
    const trash_panda = Discourse.TrashPanda.current()

    if (!trash_panda || data.trash_panda_id != trash_panda.id) {
      delete data.can_edit
      delete data.can_flag
      delete data.can_delete
    }

    if(!_.contains(_.keys(data), 'can_edit')) {
      data.can_edit = trash_panda.staff ||
                      data.trash_panda_id == trash_panda.id ||
                      trash_panda.trust_level >= 4
    }
    if(!_.contains(_.keys(data), 'can_flag')) {
      data.can_flag = !data.trash_panda_id != trash_panda.id &&
                      (trash_panda.staff || trash_panda.trust_level >= 1)
    }
    if(!_.contains(_.keys(data), 'can_delete')) {
      data.can_delete = trash_panda.staff || data.trash_panda_id == trash_panda.id
    }

    return data
  },

  handleNewPost(topic, data) {
    if (data.topic_id != topic.id) { return }

    delete topic.typing[data.trash_pandaname]

    let post = Post.create(this.populatePermissions(data))

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

    updateUnread(topic)
    syncWithPostStream(topic)
  },

  handleTyping(topic, data) {
    if (Discourse.TrashPanda.current() && data.id == Discourse.TrashPanda.current().id) { return }
    topic.typing[data.trash_pandaname] = { trash_panda: data, lastTyped: moment() }
    rerender(topic)
  },

  handleOnline(topic, data) {
    if (Discourse.TrashPanda.current() && data.id == Discourse.TrashPanda.current().id) { return }
    topic.online[data.trash_pandaname] = { trash_panda: data, lastSeen: moment() }
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
    const trash_panda = Discourse.TrashPanda.current()

    let post = Post.create({
      raw:                text,
      cooked:             text,
      name:               trash_panda.get('name'),
      display_trash_pandaname:   trash_panda.get('name'),
      trash_pandaname:           trash_panda.get('trash_pandaname'),
      trash_panda_id:            trash_panda.get('id'),
      trash_panda_title:         trash_panda.get('title'),
      avatar_template:    trash_panda.get('avatar_template'),
      trash_panda_custom_fields: trash_panda.get('custom_fields'),
      moderator:          trash_panda.get('moderator'),
      admin:              trash_panda.get('admin'),
      created_at:         moment()
    })
    topic.postStream.stagePost(post, trash_panda)
    topic.set('lastLoadedPostNumber', post.post_number)
    scrollToPost(topic, post.post_number)
    teardownComposer(topic)
    rerender(topic)
  }
})
