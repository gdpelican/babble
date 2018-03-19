
import { h } from 'virtual-dom'
import Babble from '../../lib/babble'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.availableTopics = widget.attrs.availableTopics || []
    this.availableUsers  = widget.attrs.availableUsers || []
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
    return h('div.babble-list', h('ul.babble-available-topics', [
      this.availableCategories(),
      this.availableGroups(),
      this.availablePMs()
    ]))
  },

  availableCategories() {
    let categories = this.availableTopics.filter(t => { return t.category_id })
    if (!categories.length) { return }
    return _.flatten([
      h('h5.babble-topic-section-header', I18n.t('filters.categories.title')),
      categories.map(t => { return this.availableTopicListItem(t) })
    ])
  },

  availableGroups() {
    let groups = this.availableTopics.filter(t => { return !t.category_id })
    if (!groups.length) { return }
    return _.flatten([
      h('h5.babble-topic-section-header', I18n.t('admin.groups.title')),
      groups.map(t => { return this.availableTopicListItem(t) })
    ])
  },

  availablePMs() {
    let users = this.availableUsers
    if (!users.length) { return }
    return _.flatten([
      h('h5.babble-topic-section-header', I18n.t('admin.users.title')),
      users.map(u => { return this.availableTopicListItem(u, { title: u.name }) })
    ])
  },

  availableTopicListItem(topic, opts = {}) {
    return h('li.babble-available-topic.row', [
      this.availableTopicLink(topic, opts),
      this.loadingSpinner(Babble.loadingTopicId === topic.id)
    ])
  },

  availableTopicLink(topic, opts = {}) {
    return this.widget.attach('link', {
      className: 'normalized',
      rawLabel: opts.title || topic.title,
      action: 'changeTopic',
      actionParam: topic
    })
  },

  loadingSpinner(visible) {
    if (!visible) { return }
    return h('div.spinner-container', h('div.spinner'))
  }

})
