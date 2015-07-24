import isElementInScrollableDiv from "../lib/is-element-in-scrollable-div";

export default Ember.Component.extend({

  isElementInScrollableDiv: isElementInScrollableDiv,
  layoutName: Ember.computed(function() { return 'components/' + this.get('template'); }),

  loading: Ember.computed.empty('topic'),
  unreadCount: Ember.computed('topic', function() {
    const topic = this.get('topic');
    if (topic) { return topic.highest_post_number - topic.last_read_post_number; }
    else { return 0; }
  }),

  fetchOrSetTopic: function() {
    if (Discourse.Babble == null) {
      var _this = this
      Discourse.ajax('/babble/topic.json').then(function(topic) {
        var topic = Discourse.Topic.create(topic)
        var postStream = Discourse.PostStream.create(topic.post_stream)
        postStream.posts = topic.post_stream.posts
        postStream.topic = topic
        Discourse.Babble = { topic: topic, postStream: postStream }
        _this.setupTopic()
      })
    } else { this.setupTopic() }
  }.on('init'),

  setupTopic: function() {
    this.set('topic',            Discourse.Babble.topic)
    this.set('topic.postStream', Discourse.Babble.postStream)
    this.setupMessageBus()
  },

  setupMessageBus: function() {
    const _this = this
    const messageBus = Discourse.__container__.lookup('message-bus:main')
    messageBus.subscribe('/babble', function(data) {
      var post = Discourse.Post.create(data)
      post.set('topic', _this.get('topic'))
      _this.get('topic.postStream').appendPost(post)
    })
  },

  _inserted: function() {
    var self = this
    var scrollContainer = $(this.element).find('ul.babble-posts')
    if (!scrollContainer.length) { return }

    var readVisiblePosts = function() {
      var lastVisiblePostNumber = self.getLastVisiblePostNumber(scrollContainer)
      if (lastVisiblePostNumber > self.get('topic.last_read_post_number')) {
        console.log(lastVisiblePostNumber)
      }
    }
    scrollContainer.on('scroll', Discourse.debounce(readVisiblePosts, 500))
    Ember.run.next(this, this._rendered)
  }.on('didInsertElement'),

  _rendered: function() {
    var scrollContainer = $(this.element).find('ul.babble-posts')
    scrollContainer.animate({ scrollTop: this.getLastReadLinePosition(scrollContainer) })
  },

  getLastReadLinePosition: function(scrollContainer) {
    var lastReadLine = scrollContainer.find('.babble-last-read-post-line')
    if (lastReadLine.length) {
      return lastReadLine.offset().top - scrollContainer.offset().top - 10
    } else {
      return scrollContainer.get(0).scrollHeight
    }
  },

  getLastVisiblePostNumber: function(container) {
    var self = this
    return _.max(_.map(container.find('.babble-post-container'), function(post) {
      var postElement = $(post)
      if (self.isElementInScrollableDiv(postElement.parent(), container)) { return postElement.data('post-number') }
    }))
  }
});
