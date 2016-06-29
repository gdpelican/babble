import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import Babble from '../lib/babble'

export default createWidget('babble-menu', {
  tagName: 'li.babble-menu',

  availableTopics() {
    return Babble.availableTopics.filter(function(topic) { return topic.id !== Babble.currentTopicId })
  },

  toggleView() {
    this.sendWidgetAction('toggleBabbleViewingChat')
  },

  changeTopic(topic) {
    Babble.set('loadingTopicId', topic.id)
    Discourse.ajax('/babble/topics/' + topic.id + '.json').then(
      (data)  => {
        Babble.setCurrentTopic(data)
        Babble.set('loadingTopic', null)
        this.sendWidgetAction('toggleBabbleViewingChat')
      },
      (error) => { console.log(error) }
    )
    this.scheduleRerender()
  },

  html(attrs, state) {
    return this.attach('menu-panel', { contents: () => {
      return h('section.babble-chat', attrs.viewingChat ? this.chatContents() : this.topicContents())
    }})
  },

  chatContents(attrs) {
    let currentTopic = Babble.currentTopic
    return [
      h('div', {className: 'babble-title-wrapper' }, h('div.babble-title', [
        h('h4.babble-group-title', currentTopic.title),
        h('div.babble-context-toggle.for-chat', this.attach('button', {
          className: 'normalized',
          icon:      'eye',
          title:     'babble.topic_visibility_tooltip'
        })),
        this.exchangeTopicsButton()
      ])),
      h('div.babble-list', h('ul', {className: 'babble-posts'}, this.chatView(currentTopic))),
      this.attach('babble-composer', { topic: currentTopic })
    ]
  },

  exchangeTopicsButton() {
    if (this.availableTopics().length == 0) { return }
    return h('div.babble-context-toggle.for-chat', this.attach('button', {
      className: 'normalized',
      icon:      'exchange',
      title:     'babble.view_topics_tooltip'
    }))
  },

  chatView(topic) {
    if (topic.postStream.loadingBelow) {
      return this.loadingSpinner()
    } else if (topic.postStream.posts) {
      return topic.postStream.posts.map(p => { return this.attach('babble-post', { post: p, topic: topic}) })
    } else {
      return h('li.babble-empty-topic-message', I18n.t('babble.empty_topic_message'))
    }
  },

  topicContents() {
    return [
      h('div', {className: 'babble-title-wrapper' }, h('div.babble-title', [
        this.attach('button', {
          className: 'babble-context-toggle for-topics normalized',
          icon: 'chevron-left',
          title: 'babble.view_chat_tooltip',
          action: 'toggleView' }),
        h('h4.babble-topic-switcher-title', I18n.t(`babble.select_topic`))
      ])),
      h('div.babble-list', h('ul', {className: 'babble-available-topics'},
        this.availableTopics().map(t => {
          return h('li.babble-available-topic.row', [
            this.attach('link', {
              className: 'normalized',
              rawLabel: t.title,
              action: 'changeTopic',
              actionParam: t
            }),
            Babble.loadingTopicId == t.id ? this.loadingSpinner() : null
          ])
        })
      ))
    ]
  },

  loadingSpinner() {
    return h('div.spinner-container', h('div.spinner'))
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
  }
});
