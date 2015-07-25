import isElementInScrollableDiv from "../lib/is-element-in-scrollable-div";
import isElementScrolledToBottom from "../lib/is-element-scrolled-to-bottom";

export default Ember.Component.extend({

  isElementInScrollableDiv: isElementInScrollableDiv,
  isElementScrolledToBottom: isElementScrolledToBottom,

  scrollContainer: Ember.computed(function() { return $(this.element).find('ul.babble-posts') }),

  loading: Ember.computed.empty('topic'),

  fetchOrSetTopic: function() {
    if (Discourse.Babble == null) {
      var self = this
      Discourse.ajax('/babble/topic.json').then(function(topic) {
        var topic = Discourse.Topic.create(topic)
        var postStream = Discourse.PostStream.create(topic.post_stream)
        postStream.posts = topic.post_stream.posts
        postStream.topic = topic
        Discourse.Babble = { topic: topic, postStream: postStream }
        self.setupTopic()
      })
    } else { this.setupTopic() }
  }.on('init'),

  setupTopic: function() {
    this.set('initialScroll',    true)
    this.set('topic',            Discourse.Babble.topic)
    this.set('topic.postStream', Discourse.Babble.postStream)
    this.set('reader',           new Discourse.ScreenTrack)
    this.get('reader').start(this.get('topic.id'))
    this.setupMessageBus()
    Ember.run.next(this, this.scroll)
  },

  setupMessageBus: function() {
    const self = this
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    messageBus.subscribe('/babble/post', function(data) {
      var post = Discourse.Post.create(data)
      var scrolledToBottom = self.isElementScrolledToBottom(self.get('scrollContainer'))
      post.set('topic', self.get('topic'))
      self.get('topic.postStream').appendPost(post)
      if (scrolledToBottom || Discourse.User.current().id == post.user_id) {
        self.scroll()
      }
    })
  },

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
