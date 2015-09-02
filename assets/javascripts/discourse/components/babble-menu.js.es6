import isElementScrolledToBottom from "../lib/is-element-scrolled-to-bottom"
import lastVisiblePostInScrollableDiv from "../lib/last-visible-post-in-scrollable-div"
import debounce from 'discourse/lib/debounce'
import { observes } from 'ember-addons/ember-computed-decorators';

export default Ember.Component.extend({

  isElementScrolledToBottom: isElementScrolledToBottom,
  lastVisiblePostInScrollableDiv: lastVisiblePostInScrollableDiv,

  loading: Ember.computed.empty('topic'),

  @observes('visible')
  _visible: function() {
    if (this.get('isSetup') || !Discourse.Babble || !Discourse.Babble.topic) { return }
    this.set('initialScroll',    true)
    this.set('topic',            Discourse.Babble.topic)
    this.set('topic.postStream', Discourse.Babble.postStream)
    this.setupMessageBus()

    Ember.run.scheduleOnce('afterRender', this, this._rendered)
    this.set('isSetup', true)
  },

  setupMessageBus: function() {
    const self = this
    var messageBus = Discourse.__container__.lookup('message-bus:main')
    messageBus.subscribe('/babble/post', function(data) {
      var postStream = self.get('topic.postStream')
      var post = postStream.storePost(Discourse.Post.create(data))
      post.created_at = moment(data.created_at, 'YYYY-MM-DD HH:mm:ss Z')
      postStream.appendPost(post)

      var scrolledToBottom = self.isElementScrolledToBottom(self.get('scrollContainer'))
      var userIsAuthor = Discourse.User.current().id == post.user_id
      if (scrolledToBottom || userIsAuthor) { self.scroll() }
    })
  },

  _rendered: function() {
    if (!Discourse.Babble || !Discourse.Babble.topic) { return }
    this.set('initialScroll', true)
    this.set('scrollContainer', $('.babble-menu').find('.panel-body'))
    Ember.run.next(this, this.scroll)
    this.setupTracking()
  },

  setupTracking: function() {
    const self = this
    var readOnScroll = function() {
      var lastReadPostNumber = self.lastVisiblePostInScrollableDiv(self.get('scrollContainer'))
      if (lastReadPostNumber > self.get('topic.last_read_post_number')) {
        Discourse.ajax('/babble/topic/read/' + lastReadPostNumber + '.json').then(Discourse.Babble.refresh)
      }
    }

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
  }
});
