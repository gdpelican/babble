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

  panelContents(attrs) {
    let viewingChat = attrs.viewingChat,
        availableTopics = this.availableTopics(),
        multipleTopicsAvailable = Boolean(availableTopics.length > 0),
        currentTopic = Babble.currentTopic,
        titleContents = [],
        titleWrapperClass = "babble-title-wrapper",
        submitDisabled = Babble.submitDisabled;

    if (viewingChat) {
      titleWrapperClass += " viewingChat"
      titleContents.push(h('h4.babble-group-title', currentTopic.title))
      titleContents.push(h('div.babble-context-toggle.for-chat', this.attach('button', {
        className: 'normalized',
        icon:      'eye',
        title:     'babble.topic_visibility_tooltip'
      })))
      if (multipleTopicsAvailable) {
        titleContents.push(h('div.babble-context-toggle.for-chat', this.attach('button', {
          className: 'normalized',
          icon:      'exchange',
          title:     'babble.view_topics_tooltip'
        })))
      }
    } else {
      titleContents = [
        this.attach('button', {
          className: 'babble-context-toggle for-topics normalized',
          icon: 'chevron-left',
          title: 'babble.view_chat_tooltip',
          action: 'toggleView' }),
        h('h4.babble-topic-switcher-title', I18n.t(`babble.select_topic`))
      ]
    }

    var listClass = viewingChat ? 'babble-posts' : 'babble-available-topics',
        listContents = [];

    if (viewingChat) {
      var posts = currentTopic.postStream.posts;
      if (currentTopic.postStream.loadingBelow) {
        listContents.push(h('div.spinner-container', h('div.spinner')));
      } else if (posts.length) {
        var posts = posts.map(p => this.attach('babble-post', {post: p, topic: currentTopic}));
        listContents.push(posts);
      } else {
        listContents.push(h('li.babble-empty-topic-message', I18n.t(`babble.empty_topic_message`)))
      }
    } else {
      listContents = availableTopics.map((t) => {
        var spinner = Babble.loadingTopicId === t.id ? h('div.spinner-container', h('div.spinner')) : ''
        return h('li.babble-available-topic.row', [
          this.attach('link', {
          className: 'normalized',
          rawLabel: t.title,
          action: 'changeTopic',
          actionParam: t
        }), spinner])
      })
    }

    var contents = [
      h('div', {className: titleWrapperClass}, h('div.babble-title', titleContents )),
      h('div.babble-list', h('ul', {className: listClass}, listContents))
    ]
    const {notifications} = currentTopic
    const users = Object.keys(notifications).filter(username => this.currentUser.username !== username)
    if (users.length) {
      contents.push(this.attach('small-user-list', {
        users: users.map(user => notifications[user].user),
        listClassName: 'who-liked',
        description: 'babble.is_typing'
      }));
    }
    if (viewingChat) {
      contents.push(this.attach('babble-composer', {
        topic: currentTopic,
        submitDisabled: submitDisabled
      }))
    }

    return h('section.babble-chat', contents)
  },

  html(attrs, state) {
    return this.attach('menu-panel', { contents: () => this.panelContents(attrs) });
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
  }
});
