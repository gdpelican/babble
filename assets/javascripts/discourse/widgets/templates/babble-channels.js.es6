import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'
import { iconNode } from "discourse-common/lib/icon-library";
import getURL from "discourse-common/lib/get-url";
import Babble from '../../lib/babble'
import { flatten, compact } from '../../lib/babble-utils';

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
    return [
      this.topicsHeaderIcon(),
      this.topicsHeaderText(),
      this.closeButton()
    ]
  },

  closeButton() {
    return h('div.babble-context-toggle', this.widget.attach('button', {
      className: 'normalized',
      icon:      'times',
      action:    'closeChat',
      title:     'babble.close_chat'
    }))
  },

  searchButton(type) {
    if (this.widget.state.search[type]) { return }
    return this.widget.attach('button', {
      icon:      'search',
      className: 'normalized',
      action:    `${type}Search`
    })
  },

  searchAutocomplete(type) {
    if (!this.widget.state.search[type]) { return }
    return h(`div.babble-${type}-autocomplete`, h('input', { placeholder: I18n.t(`babble.${type}_autocomplete`)}))
  },

  topicsHeaderIcon() {
    const icon = Discourse.SiteSettings.babble_icon
    return iconNode(icon, { class: 'babble-title-icon'} )
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
    let categories = this.availableTopics.filter(t => { return t.permissions == 'category' })
    if (!categories.length) { return }
    return flatten([
      h('h5.babble-topic-section-header', I18n.t('babble.categories_title')),
      categories.map(t => { return this.availableTopicListItem(t, 'category') })
    ])
  },

  availableGroups() {
    let groups = this.availableTopics.filter(t => { return t.permissions == 'group' })
    if (!groups.length) { return }
    return flatten([
      h('h5.babble-topic-section-header', I18n.t('babble.groups_title')),
      groups.map(t => { return this.availableTopicListItem(t, 'group') })
    ])
  },

  availablePMs() {
    let users = this.availableUsers.sort((a, b) => (new Date(b.last_posted_at) - new Date(a.last_posted_at))).reverse()
    if (!users.length) { return }
    return compact(flatten([
      h('.babble-topic-section-header-wrapper', compact([
        h('h5.babble-topic-section-header', I18n.t('babble.pms_title')),
        this.searchButton('pms')
      ])),
      this.searchAutocomplete('pms'),
      users.map(u => { return this.availableTopicListItem(u, 'user') })
    ]))
  },

  availableTopicListItem(item, type) {
    let css = item.unreadCount ? '.unread' : ''
    return h(`li.babble-available-topic.row${css}`, [
      this.availableTopicAvatar(item, type),
      this.availableTopicLink(item, type),
      this.notificationCounter(item),
      this.loadingSpinner(Babble.loadingTopicId === item.id)
    ])
  },

  availableTopicAvatar(item, type) {
    switch(type) {
      case 'category':
        return h('span.babble-topic-avatar', { style: { 'background-color': `#${item.category.color}` } })
      case 'group':
        return h('img.babble-topic-avatar', { src: getURL('/images/avatar.png') })
      case 'user':
        let css = this.widget.attrs.isOnline(item.id) ? '.user-online' : ''
        return h(`span.babble-topic-avatar.topic-avatar${css}`, avatarImg('small', { template: item.avatar_template, username: item.username}))
    }
  },

  availableTopicLink(item, type) {
    return this.widget.attach('link', {
      rawLabel: type == 'user' ? (item.name || item.username) : item.title,
      action: 'changeTopic',
      actionParam: item
    })
  },

  notificationCounter(item) {
    if (Babble.loadingTopicId == item.id) { return }
    let count = Babble.notificationsFor(item).length
    if (count > 0) {
      return h('div.babble-unread', count.toString())
    }
  },

  loadingSpinner(visible) {
    if (!visible) { return }
    return h('div.spinner-container', h('div.spinner'))
  }

})
