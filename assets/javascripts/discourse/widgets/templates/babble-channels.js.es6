import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'
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
      categories.map(t => { return this.availableTopicListItem(t, 'category') })
    ])
  },

  availableGroups() {
    let groups = this.availableTopics.filter(t => { return !t.category_id })
    if (!groups.length) { return }
    return _.flatten([
      h('h5.babble-topic-section-header', I18n.t('admin.groups.title')),
      groups.map(t => { return this.availableTopicListItem(t, 'group') })
    ])
  },

  availablePMs() {
    let users = this.availableUsers
    if (!users.length) { return }
    return _.flatten([
      h('h5.babble-topic-section-header', I18n.t('admin.users.title')),
      users.map(u => { return this.availableTopicListItem(u, 'user') })
    ])
  },

  availableTopicListItem(item, type) {
    return h('li.babble-available-topic.row', [
      this.availableTopicAvatar(item, type),
      this.availableTopicLink(item, type),
      this.loadingSpinner(Babble.loadingTopicId === item.id)
    ])
  },

  availableTopicAvatar(item, type) {
    switch(type) {
      case 'category':
        return h('span.babble-topic-avatar', { style: { 'background-color': `#${item.category.color}` } })
      case 'group':
        return h('img.babble-topic-avatar', { src: Discourse.getURL('/images/avatar.png') })
      case 'user':
        return avatarImg('small', {template: item.avatar_template, username: item.username})
    }
  },

  availableTopicLink(item, type) {
    return this.widget.attach('link', {
      rawLabel: type == 'user' ? item.name : item.title,
      action: 'changeTopic',
      actionParam: item
    })
  },

  loadingSpinner(visible) {
    if (!visible) { return }
    return h('div.spinner-container', h('div.spinner'))
  }

})
