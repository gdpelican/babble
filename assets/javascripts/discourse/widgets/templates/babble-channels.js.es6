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

  searchButton(type) {
    if (this.widget.state.search[type]) { return }
    return this.widget.attach('button', {
      icon:      'search',
      action:    `${type}Search`
    })
  },

  searchAutocomplete(type) {
    if (!this.widget.state.search[type]) { return }
    return h(`div.babble-${type}-autocomplete`, h('input', { placeholder: I18n.t(`babble.${type}_autocomplete`)}))
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
      h('h5.babble-topic-section-header', I18n.t('babble.categories_title')),
      categories.map(t => { return this.availableTopicListItem(t, 'category') })
    ])
  },

  availableGroups() {
    let groups = this.availableTopics.filter(t => { return !t.category_id })
    if (!groups.length) { return }
    return _.flatten([
      h('h5.babble-topic-section-header', I18n.t('babble.groups_title')),
      groups.map(t => { return this.availableTopicListItem(t, 'group') })
    ])
  },

  availablePMs() {
    let users = this.availableUsers
    if (!users.length) { return }
    return _.compact(_.flatten([
      h('.babble-topic-section-header-wrapper', _.compact([
        h('h5.babble-topic-section-header', I18n.t('babble.pms_title')),
        this.searchButton('pms')
      ])),
      this.searchAutocomplete('pms'),
      users.map(u => { return this.availableTopicListItem(u, 'user') })
    ]))
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
        return h('span.babble-topic-avatar', avatarImg('small', { template: item.avatar_template, username: item.username}))
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
