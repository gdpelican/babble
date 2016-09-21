import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.topic           = this.widget.attrs.topic
    this.availableTopics = this.widget.attrs.availableTopics || []
    if (!this.topic) { return }
    return this.chatContents()
  },

  chatContents() {
    return [
      h('div.babble-title-wrapper', h('div.babble-title', [
        this.chatTitle(),
        this.visibilityButton(),
        this.exchangeTopicsButton()
      ])),
      h('div.babble-list', { attributes: { 'scroll-container': 'inactive' } }, h('ul', {className: 'babble-posts'}, this.chatView())),
      this.widget.attach('babble-notifications', { notifications: this.topic.notifications }),
      this.widget.attach('babble-composer', { topic: this.topic })
    ]
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
      return this.topic.postStream.posts.map(p => { return this.widget.attach('babble-post', {
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
