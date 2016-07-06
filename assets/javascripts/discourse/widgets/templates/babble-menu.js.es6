import { h } from 'virtual-dom'
import Babble from '../../lib/babble'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return this.widget.attach('menu-panel', { contents: () => { return this.panel() } })
  },

  availableTopics() {
    let currentTopicId = Babble.get('currentTopic.id')
    return Babble.availableTopics.filter(function(t) { return t.id !== currentTopicId })
  },

  panel() {
    return h('section.babble-chat', this.activePanel())
  },

  activePanel() {
    if (this.widget.state.viewingChat) {
      return this.chatContents()
    } else {
      return this.topicContents()
    }
  },

  chatContents() {
    return [
      h('div.babble-title-wrapper', h('div.babble-title', [
        this.chatTitle(),
        this.visibilityButton(),
        this.exchangeTopicsButton()
      ])),
      h('div.babble-list', { attributes: { 'scroll-container': 'inactive' } }, h('ul', {className: 'babble-posts'}, this.chatView())),
      this.widget.attach('babble-composer', { topic: Babble.currentTopic })
    ]
  },

  chatTitle() {
    return h('h4.babble-group-title', Babble.currentTopic.title)
  },

  visibilityButton() {
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className:    'normalized',
      icon:         'eye',
      title:        'babble.topic_visibility_tooltip',
      titleOptions: { groupNames: Babble.currentTopic.group_names }
    }))
  },

  exchangeTopicsButton() {
    if (this.availableTopics().length == 0) { return }
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className: 'normalized',
      icon:      'exchange',
      action:    'toggleView',
      title:     'babble.view_topics_tooltip'
    }))
  },

  chatView() {
    let topic = Babble.currentTopic
    if (topic.postStream.loadingBelow) {
      return this.loadingSpinner(true)
    } else if (topic.postStream.posts.length) {
      return topic.postStream.posts.map(p => { return this.widget.attach('babble-post', {
        post: p,
        topic: topic,
        isLastRead: this.widget.state.lastReadPostNumber == p.post_number
      }) })
    } else {
      return h('li.babble-empty-topic-message', I18n.t('babble.empty_topic_message'))
    }
  },

  topicContents() {
    return [this.topicsHeader(), this.topicsList()]
  },

  topicsHeader() {
    return h('div.babble-title-wrapper', h('div.babble-title', this.topicsHeaderContent()))
  },

  topicsHeaderContent() {
    return [this.backButton(), this.topicsHeaderText()]
  },

  backButton() {
    return this.widget.attach('button', {
      className: 'babble-context-toggle for-topics normalized',
      icon:      'chevron-left',
      title:     'babble.view_chat_tooltip',
      action:    'toggleView'
    })
  },

  topicsHeaderText() {
    return h('h4.babble-topic-switcher-title', I18n.t('babble.select_topic'))
  },

  topicsList() {
    return h('div.babble-list', h('ul.babble-available-topics', this.availableTopicsList()))
  },

  availableTopicsList() {
    return this.availableTopics().map(t => { return this.availableTopicListItem(t) })
  },

  availableTopicListItem(topic) {
    return h('li.babble-available-topic.row', [
      this.availableTopicLink(topic),
      this.loadingSpinner(Babble.loadingTopicId === topic.id)
    ])
  },

  availableTopicLink(topic) {
    return this.widget.attach('link', {
      className: 'normalized',
      rawLabel: topic.title,
      action: 'changeTopic',
      actionParam: topic
    })
  },

  loadingSpinner(visible) {
    if (!visible) { return }
    return h('div.spinner-container', h('div.spinner'))
  }

})
