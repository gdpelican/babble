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

  currentTopic: function() {
    return Discourse.Babble.currentTopic
  }.property('Discourse.Babble.currentTopic'),

  latestPost: function() {
    return Discourse.Babble.latestPost
  }.property('Discourse.Babble.latestPost'),

  availableTopics: function() {
    var self = this
    return _.filter(Discourse.Babble.availableTopics, function(topic) { return topic.id != self.get('currentTopic.id') })
  }.property('Discourse.Babble.currentTopic', 'Discourse.Babble.availableTopics'),

  @observes('currentTopic', 'availableTopics')
  multipleTopicsAvailable: function() {
    return this.get('availableTopics').length > 0
  },

  @observes('visible')
  _visible: function() {
    if (!this.ready()) { return }
    Ember.run.scheduleOnce('afterRender', this, this._rendered)
  },

  @observes('currentTopic')
  _rendered: function() {
    this._actions.viewChat(this)
    this.set('initialScroll', true)
    this.setupScrollContainer()
    this.setupTracking()
  },

  @observes('latestPost')
  messageBusPostCallback: function(context) {
    var scrolledToBottom = this.isElementScrolledToBottom(this.get('scrollContainer'))
    var userIsAuthor = Discourse.User.current().id == Discourse.Babble.latestPost.user_id
    if (scrolledToBottom || userIsAuthor) { this.scroll() }
  },

  setupScrollContainer: function() {
    this.set('scrollContainer', $('.babble-menu').find('.panel-body'))
    if (this.get('scrollContainer').get(0)) {
      Ember.run.next(this, this.scroll)
    }
  },

  setupTracking: function() {
    const self = this
    var readOnScroll = function() {
      var lastReadPostNumber = self.lastVisiblePostInScrollableDiv(self.get('scrollContainer'))
      if (lastReadPostNumber > self.get('currentTopic.last_read_post_number')) {
        Discourse.ajax('/babble/topics/' + self.get('currentTopic.id') + '/read/' + lastReadPostNumber + '.json').then(Discourse.Babble.setCurrentTopic)
      }
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
