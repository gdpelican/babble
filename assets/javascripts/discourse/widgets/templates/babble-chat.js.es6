import { h } from 'virtual-dom'
import { isFollowOn, isNewDay } from '../../lib/chat-topic-utils'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.topic           = this.widget.attrs.topic
    this.availableTopics = this.widget.attrs.availableTopics || []
    this.csrf            = this.widget.state.csrf
    if (!this.topic) { return }
    return this.chatContents()
  },

  chatContents() {
    let contents = [
      h('div.babble-list', { attributes: { 'scroll-container': 'inactive' } }, [
        this.pressurePlate('desc'),
        h('ul', {className: 'babble-posts'}, this.chatView()),
        this.pressurePlate('asc')
      ]),
      this.widget.attach('babble-typing', { topic: this.topic }),
      this.widget.attach('babble-composer', { topic: this.topic, csrf: this.csrf })
    ]
    if (!this.widget.attrs.fullpage) {
      contents.unshift(
        h('div.babble-title-wrapper', h('div.babble-title', [
          this.switchTopicsButton(),
          this.chatTitle(),
          this.modifySizeButton(),
          this.closeButton()
        ]))
      )
    }
    return contents
  },

  pressurePlate(order) {
    if (!this.topic.postStream.posts.length) { return }
    if (order === 'asc' && this.topic.highest_post_number == this.topic.lastLoadedPostNumber) { return }
    return h('div.babble-post-hr-message', this.pressurePlateMessage(order))
  },

  pressurePlateMessage(order) {
    var canLoadMore, actionName

    switch(order) {
      case 'desc':
        actionName = 'loadPostsBackward'
        canLoadMore = this.topic.firstLoadedPostNumber > this.topic.lowest_post_number
        break
      case 'asc':
        actionName = 'loadPostsForward'
        canLoadMore = this.topic.lastLoadedPostNumber  < this.topic.highest_post_number
        break
    }

    if (this.topic.loadingPosts) {
      return h('span.babble-load-message', I18n.t('babble.loading_messages'))
    } else if (canLoadMore) {
      return this.widget.attach('button', {
        label:     'babble.load_more',
        className: `babble-load-message babble-pressure-plate ${order}`,
        action:    actionName
      })
    } else {
      return h('span.babble-load-message', I18n.t('babble.no_more_messages'))
    }
  },

  chatTitle() {
    return h('h4.babble-group-title', this.topic.title)
  },

  modifySizeButton() {
    if (this.widget.attrs.mobile) { return }
    let options = { className: 'normalized' }
    if (this.widget.attrs.expanded) {
      options.icon   = 'compress'
      options.action = 'compressChat'
      options.title  = 'babble.compress_chat'
    } else {
      options.icon   = 'expand'
      options.action = 'expandChat'
      options.title  = 'babble.expand_chat'
    }
    return h('div.babble-context-toggle', this.widget.attach('button', options))
  },

  closeButton() {
    return h('div.babble-context-toggle', this.widget.attach('button', {
      className: 'normalized',
      icon:      'close',
      action:    'closeChat',
      title:     'babble.close_chat'
    }))
  },

  switchTopicsButton() {
    if (this.availableTopics.length == 0) { return }
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className: 'normalized',
      icon:      'list-ul',
      action:    'viewChannels',
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
