import isElementScrolledToBottom from "../lib/is-element-scrolled-to-bottom"
import lastVisiblePostInScrollableDiv from "../lib/last-visible-post-in-scrollable-div"

export default Ember.Component.extend({

  isElementScrolledToBottom: isElementScrolledToBottom,
  lastVisiblePostInScrollableDiv: lastVisiblePostInScrollableDiv,

  scrollContainer: Ember.computed(function() { return $(this.element).find('ul.babble-posts') }),

  loading: Ember.computed.empty('topic'),

  _init: function() {
    this.set('initialScroll',    true)
    this.set('topic',            Discourse.Babble.topic)
    this.set('topic.postStream', Discourse.Babble.postStream)
  }.on('init'),

  setupMessageBus: function() {
    const self = this
    var messageBus = Discourse.__container__.lookup('message-bus:main')
    messageBus.subscribe('/babble/post', function(data) {
      var post = Discourse.Post.create(data)
      var scrolledToBottom = self.isElementScrolledToBottom(self.get('scrollContainer'))
      post.set('topic', self.get('topic'))
      self.get('topic.postStream').appendPost(post)
      if (scrolledToBottom || Discourse.User.current().id == post.user_id) {
        self.scroll()
      }
    })
  }.on('init'),

  _inserted: function() {
    this.set('scrollContainer', $(this.element).find('.babble-posts'))
    Ember.run.next(this, this.scroll)
  }.on('didInsertElement'),

  setupTracking: function() {
    const self = this
    var readOnScroll = function() {
      var lastReadPostNumber = self.lastVisiblePostInScrollableDiv(self.get('scrollContainer'))
      if (lastReadPostNumber > self.get('topic.last_read_post_number')) {
        Discourse.ajax('/babble/topic/read/' + lastReadPostNumber + '.json').then(function(topic) {
          var topic = Discourse.Topic.create(topic)
          var postStream = Discourse.PostStream.create(topic.post_stream)
          postStream.posts = topic.post_stream.posts
          postStream.topic = topic
          Discourse.Babble = { topic: topic, postStream: postStream }
          self._init()
        })
      }
    }

    self.get('scrollContainer').on('scroll', Discourse.debounce(readOnScroll, 500))
  }.on('didInsertElement'),

  scroll: function() {
    var scrollSpeed = this.get('initialScroll') ? 0 : 750 // Scroll immediately on initial scroll
    this.get('scrollContainer').animate({ scrollTop: this.getLastReadLinePosition() }, scrollSpeed)
    this.set('initialScroll', false)
  },

  getLastReadLinePosition: function() {
    var container = this.get('scrollContainer')
    var lastReadLine = container.find('.babble-last-read-post-line')
    if (this.get('initialScroll') && lastReadLine.length) {
      return lastReadLine.offset().top - container.offset().top - 10
    } else {
      return container.get(0).scrollHeight
    }
  }
});
