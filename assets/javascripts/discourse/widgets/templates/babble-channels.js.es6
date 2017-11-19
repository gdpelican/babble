
import { h } from 'virtual-dom'
import Babble from '../../lib/babble'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.availableTopics = this.widget.attrs.availableTopics || []
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
      action:    'viewChat'
    })
  },

  topicsHeaderText() {
    return h('h4.babble-topic-switcher-title', I18n.t('babble.select_topic'))
  },

  topicsList() {
    return h('div.babble-list', h('ul.babble-available-topics', this.availableTopicsList()))
  },

  availableTopicsList() {
    return this.availableTopics.map(t => { return this.availableTopicListItem(t) })
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
