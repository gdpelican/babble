import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

export default createWidget('babble-menu', {
  tagName: 'li.babble-menu',

  defaultState() {
    return {
      viewingChat: true
    }
  },

  availableTopics() {
    var currentTopicId = Discourse.Babble.currentTopicId
    return Discourse.Babble.availableTopics.filter(function(topic) { return topic.id !== currentTopicId })
  },

  toggleView() {
    this.state.viewingChat = !this.state.viewingChat
  },

  changeTopic(topic) {
    Discourse.ajax('/babble/topics/' + topic.id + '.json').then(Discourse.Babble.setCurrentTopic)
  },

  panelContents(state) {
    var viewingChat = state.viewingChat,
        availableTopics = this.availableTopics(),
        multipleTopicsAvailable = Boolean(availableTopics.length > 0),
        currentTopic = Discourse.Babble.currentTopic,
        titleWrapperClass = "babble-title-wrapper";

    if (viewingChat) {
      titleWrapperClass += "viewingChat"
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
        listContents.push(h('ul', [posts]));
      } else {
        listContents.push(h('li.babble-empty-topic-message', I18n.t(`babble.empty_topic_message`)))
      }
    } else {
      listContents = availableTopics.map(t => {
        h('li.babble-available-topic.row',
          h('button.normalized', {
            action: 'changeTopic',
            actionParam: t
          }, h('div.babble-available-topic-title', t.title))
        )
      })
    }

    var contents = [
      h('div', {className: titleWrapperClass}, h('div.babble-title', titleContents )),
      h('ul', {className: listClass}, listContents)
    ]
    const notifications = Object.keys(currentTopic.notifications)
    if (notifications.length) {
      contents.push(h('p', `${notifications.join(", ")} have interacted with notifications anyhow.`))
    }
    if (viewingChat) {contents.push(this.attach('babble-composer', {topic: currentTopic }))}

    return h('section.babble-chat', contents)
  },

  html(attrs, state) {
    return this.attach('menu-panel', { contents: () => this.panelContents(state) });
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
  }
});
