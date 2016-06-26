import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

export default createWidget('babble-menu', {
  tagName: 'li.babble-menu',

  availableTopics() {
    var currentTopicId = Discourse.Babble.currentTopicId
    return Discourse.Babble.availableTopics.filter(function(topic) { return topic.id !== currentTopicId })
  },

  toggleView() {
    this.sendWidgetAction('toggleBabbleViewingChat')
  },

  changeTopic(topic) {
    Discourse.Babble.set('loadingTopicId', topic.id)
    Discourse.ajax('/babble/topics/' + topic.id + '.json').then((result) => {
      Discourse.Babble.setCurrentTopic(result)
      Discourse.Babble.set('loadingTopic', null)
      this.sendWidgetAction('toggleBabbleViewingChat')
    })
    this.scheduleRerender()
  },

  panelContents(attrs) {
    var viewingChat = attrs.viewingChat,
        availableTopics = this.availableTopics(),
        multipleTopicsAvailable = Boolean(availableTopics.length > 0),
        currentTopic = Discourse.Babble.currentTopic,
        titleWrapperClass = "babble-title-wrapper",
        submitDisabled = Discourse.Babble.submitDisabled;

    if (viewingChat) {
      titleWrapperClass += " viewingChat"
      var contextButtonAttrs = multipleTopicsAvailable ?
                               { className: 'normalized', icon: 'exchange', title: 'babble.view_topics_tooltip', action: 'toggleView' } :
                               { className: 'normalized', icon: 'eye', title: 'topic_visibility_tooltip'},
          titleContents = [
            h('h4.babble-group-title', currentTopic.title),
            h('div.babble-context-toggle.for-chat', this.attach('button', contextButtonAttrs))
          ]
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
        var spinner = Discourse.Babble.loadingTopicId === t.id ? h('div.spinner-container', h('div.spinner')) : ''
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
    if (viewingChat && !Discourse.Babble.editingPostId) {
      contents.push(this.attach('babble-composer', {topic: currentTopic, submitDisabled: submitDisabled }))
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
