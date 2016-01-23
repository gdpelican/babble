import isElementScrolledToBottom from "../lib/is-element-scrolled-to-bottom"
import lastVisiblePostInScrollableDiv from "../lib/last-visible-post-in-scrollable-div"
import debounce from 'discourse/lib/debounce'
import { observes } from 'ember-addons/ember-computed-decorators'

export default Ember.Component.extend({

  isElementScrolledToBottom: isElementScrolledToBottom,
  lastVisiblePostInScrollableDiv: lastVisiblePostInScrollableDiv,

  ready: function() {
    return this.get('visible') && Discourse.Babble && Discourse.Babble.currentTopic
  },

  currentTopicId: function() {
    return Discourse.Babble.currentTopicId
  }.property('Discourse.Babble.currentTopicId'),

  currentTopic: function() {
    return Discourse.Babble.currentTopic
  }.property('Discourse.Babble.currentTopic'),

  availableTopics: function() {
    var currentTopicId = this.get('currentTopicId')
    return _.filter(Discourse.Babble.availableTopics, function(topic) { return topic.id != currentTopicId })
  }.property('Discourse.Babble.currentTopicId', 'Discourse.Babble.availableTopics'),

  multipleTopicsAvailable: function() {
    return this.get('availableTopics').length > 0
  }.property('availableTopics.length'),

  @observes('visible')
  _visible: function() {
    Discourse.Babble.set('menuVisible', this.get('visible'))
    if (!this.ready()) { return }
    Ember.run.scheduleOnce('afterRender', this, this.topicChanged)
  },

  @observes('Discourse.Babble.currentTopicId')
  topicChanged: function() {
    this._actions.viewChat(this)
    this.set('initialScroll', true)
    this.setupScrolling()
  },

  @observes('Discourse.Babble.latestPost')
  messageBusPostCallback: function() {
    var scrolledToBottom = this.isElementScrolledToBottom(this.get('scrollContainer'))
    if (scrolledToBottom || Discourse.Babble.lastPostIsMine()) { this.scroll() }
  },

  setupScrolling: function() {
    const self = this
    self.set('scrollContainer', $('.babble-menu').find('.panel-body'))

    var readOnScroll = function() {
      var lastReadPostNumber = self.lastVisiblePostInScrollableDiv(self.get('scrollContainer'))
      if (lastReadPostNumber > self.get('currentTopic.last_read_post_number')) {
        Discourse.ajax('/babble/topics/' + self.get('currentTopicId') + '/read/' + lastReadPostNumber + '.json').then(Discourse.Babble.setCurrentTopic)
      }
    }

    if (self.get('scrollContainer').get(0)) {
      Ember.run.next(self, self.scroll)
    }

    self.get('scrollContainer').off('scroll')
    self.get('scrollContainer').on('scroll', debounce(readOnScroll, 500))
  },

  scroll: function() {
    var scrollSpeed = this.get('initialScroll') ? 0 : 750 // Scroll immediately on initial scroll
    this.get('scrollContainer').animate({ scrollTop: this.getLastReadLinePosition() }, scrollSpeed)
    this.set('initialScroll', false)
  },

  getLastReadLinePosition: function() {
    var container = this.get('scrollContainer')
    var lastReadLine = container.find('.babble-last-read-post-message')

    if (this.get('initialScroll') && lastReadLine.length) {
      return lastReadLine.offset().top - container.offset().top - 10
    } else {
      return container.get(0).scrollHeight
    }
  },

  actions: {
    viewChat:    function(context) { (context || this).set('viewingChat', true) },
    viewTopics:  function(context) { (context || this).set('viewingChat', false) },
    changeTopic: function(topic)   { Discourse.ajax('/babble/topics/' + topic.id + '.json').then(Discourse.Babble.setCurrentTopic) }
  }
});
