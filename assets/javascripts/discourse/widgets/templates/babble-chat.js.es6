import { h } from 'virtual-dom'
import Babble from '../../lib/babble'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.topic           = this.widget.attrs.topic
    this.availableTopics = this.widget.attrs.availableTopics || []
    this.canSignUp       = this.widget.attrs.canSignUp
    if (!this.topic) { return }
    return this.chatContents()
  },

  chatContents() {
    let contents = [
      h('div.babble-list', { attributes: { 'scroll-container': 'inactive' } }, [
        this.pressurePlate(),
        h('ul', {className: 'babble-posts'}, this.chatView())
      ]),
      this.widget.attach('babble-notifications', { notifications: this.topic.notifications }),
      this.widget.attach('babble-composer', { topic: this.topic, canSignUp: this.canSignUp })
    ]
    if (!this.widget.attrs.fullpage) {
      contents.unshift(
        h('div.babble-title-wrapper', h('div.babble-title', [
          this.chatTitle(),
          this.visibilityButton(),
          this.exchangeTopicsButton()
        ]))
      )
    }
    return contents
  },

  pressurePlate() {
    if (!this.topic.postStream.posts.length) { return }
    return h('div.babble-load-history', this.pressurePlateMessage())
  },

  pressurePlateMessage() {
    if (Babble.get('loadingPreviousPosts')) {
      return h('div.babble-load-history-message', I18n.t('babble.loading_history'))
    } else if (Babble.firstLoadedPostNumber() > 1) {
      return this.widget.attach('button', {
        label:     'babble.load_more',
        className: 'babble-load-history-message babble-pressure-plate',
        action:    'loadPreviousPosts'
      })
    } else {
      return h('div.babble-load-history-message', I18n.t('babble.no_more_history'))
    }
  },

  chatTitle() {
    return h('h4.babble-group-title', this.topic.title)
  },

  visibilityButton() {
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className:    'normalized',
      icon:         'eye',
      title:        'babble.topic_visibility_tooltip',
      titleOptions: { groupNames: this.topic.group_names }
    }))
  },

  exchangeTopicsButton() {
    if (this.availableTopics.length == 0) { return }
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className: 'normalized',
      icon:      'exchange',
      action:    'toggleView',
      title:     'babble.view_topics_tooltip'
    }))
  },

  chatView() {
    if (this.topic.postStream.loadingBelow) {
      return this.loadingSpinner()
    } else if (this.topic.postStream.posts.length) {
      return this.topic.postStream.posts
        .sort((a, b) => { return a.post_number - b.post_number })
        .map(p => { return this.widget.attach('babble-post', {
        post: p,
        topic: this.topic,
        isLastRead: this.widget.state.lastReadPostNumber == p.post_number
      }) })
    } else {
      return h('li.babble-empty-topic-message', I18n.t('babble.empty_topic_message'))
    }
  },

  loadingSpinner() {
    return h('div.spinner-container', h('div.spinner'))
  }
})
