import { h } from 'virtual-dom'
import { isFollowOn, isNewDay } from '../../lib/chat-topic-utils'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.topic           = this.widget.attrs.topic
    this.availableTopics = this.widget.attrs.availableTopics || []
    this.canSignUp       = this.widget.attrs.canSignUp
    this.category        = this.widget.state.category
    this.fullpage        = this.widget.attrs.fullpage
    if (!this.topic) { return }
    return this.chatContents()
  },

  chatContents() {
    let contents = [
      this.scrollContainer(),
      this.widget.attach('babble-typing', { topic: this.topic }),
      this.widget.attach('babble-composer', { topic: this.topic, canSignUp: this.canSignUp })
    ]

    if (this.fullpage) {
      contents.unshift(this.whosOnline())
    } else {
      contents.unshift(this.chatTitleBar())
    }

    return contents
  },

  chatTitleBar() {
    if (this.widget.attrs.fullpage) { return }
    return h('div.babble-title-wrapper', h('div.babble-title', [
      h('div.babble-title-left',  [this.switchTopicsButton(), this.chatTitle()]),
      h('div.babble-title-right', [this.whosOnline(), this.fullPageLink()])
    ]))
  },

  whosOnline() {
    return this.widget.attach('babble-online', { topic: this.topic, fullpage: this.fullpage })
  },

  scrollContainer() {
    return h('div.babble-list', { attributes: { 'scroll-container': 'inactive' } }, [
      this.pressurePlate('desc'),
      h('ul', {className: 'babble-posts'}, this.chatView()),
      this.pressurePlate('asc')
    ])
  },

  pressurePlate(order) {
    if (!this.topic.postStream.posts.length) { return }
    if (order === 'asc' && this.topic.highest_post_number == this.topic.lastLoadedPostNumber) { return }
    return h('div.babble-load-more', this.pressurePlateMessage(order))
  },

  pressurePlateMessage(order) {
    var canLoadMore, actionName

    switch(order) {
      case 'desc':
        actionName = 'loadPostsBackward'
        canLoadMore = this.topic.firstLoadedPostNumber > 1
        break
      case 'asc':
        actionName = 'loadPostsForward'
        canLoadMore = this.topic.lastLoadedPostNumber  < this.topic.highest_post_number
        break
    }

    if (this.topic.loadingPosts) {
      return h('div.babble-load-message', I18n.t('babble.loading_messages'))
    } else if (canLoadMore) {
      return this.widget.attach('button', {
        label:     'babble.load_more',
        className: `babble-load-message babble-pressure-plate ${order}`,
        action:    actionName
      })
    } else {
      return h('div.babble-load-message', I18n.t('babble.no_more_messages'))
    }
  },

  chatTitle() {
    return h('h4.babble-group-title', this.topic.title)
  },

  fullPageLink() {
    if (!this.category || !this.topic.postStream.posts.length) { return }
    return h('div.babble-context-toggle.babble-full-page-link', this.widget.attach('button', {
      className: 'normalized',
      icon:      'external-link',
      action:    'goToChat',
      title:     'babble.go_to_chat',
      sendActionEvent: true
    }))
  },

  switchTopicsButton() {
    if (this.availableTopics.length == 0) { return }
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className: 'normalized',
      icon:      'bars',
      action:    'toggleView',
      title:     'babble.view_topics_tooltip'
    }))
  },

  chatView() {
    let stream = this.topic.postStream
    if (stream.loadingBelow) {
      return this.loadingSpinner()
    } else if (stream.posts.length) {
      let posts = stream.posts.sort((a,b) => { return a.post_number - b.post_number })
      return posts.map((post, index) => {
        return this.widget.attach('babble-post', {
          post: post,
          topic: this.topic,
          isFollowOn: isFollowOn(post, posts[index-1]),
          isNewDay: isNewDay(post, posts[index-1])
        })
      })
    } else {
      return h('li.babble-empty-topic-message', I18n.t('babble.empty_topic_message'))
    }
  },

  loadingSpinner() {
    return h('div.spinner-container', h('div.spinner'))
  }
})
