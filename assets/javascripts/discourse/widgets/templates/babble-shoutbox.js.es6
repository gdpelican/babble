import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    this.topic           = this.widget.state.topic
    this.category        = this.widget.state.category
    this.availableTopics = this.widget.state.availableTopics || []
    this.viewingChannels = this.widget.state.viewingChannels

    return this.widget.attach('menu-panel', { contents: () => {
      if (this.viewingChannels) {
        return h('div.babble-channels-container', [
          this.channelsHeader(),
          widget.attach('babble-channels', { topic: this.topic, availableTopics: this.availableTopics })
        ])
      } else {
        return h('div.babble-topic-container', [
          this.chatHeader(),
          widget.attach('babble-chat',     { topic: this.topic }),
          widget.attach('babble-typing',   { topic: widget.state.topic }),
          widget.attach('babble-composer', { topic: this.topic })
        ])
      }
    }})
  },

  chatHeader() {
    return h('div.babble-title-wrapper', h('div.babble-title', [
      h('div.babble-title-left',  [this.switchTopicsButton(), this.chatTitle()]),
      h('div.babble-title-right', [this.whosOnline(), this.fullPageLink()])
    ]))
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

  chatTitle() {
    return h('h4.babble-group-title', this.topic.title)
  },

  whosOnline() {
    return this.widget.attach('babble-online', { topic: this.topic })
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

  channelsHeader() {
    return h('div.babble-title-wrapper', h('div.babble-title', h('div.babble-title-left', [
      this.backButton(),
      this.switchTopicsTitle()
    ])))
  },

  backButton() {
    return this.widget.attach('button', {
      className: 'babble-context-toggle for-topics normalized',
      icon:      'chevron-left',
      title:     'babble.view_chat_tooltip',
      action:    'toggleView'
    })
  },

  switchTopicsTitle() {
    return h('h4.babble-topic-switcher-title', I18n.t('babble.select_topic'))
  }
})
