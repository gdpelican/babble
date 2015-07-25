import isElementInScrollableDiv from "../lib/is-element-in-scrollable-div";

export default Ember.Component.extend({

  isElementInScrollableDiv: isElementInScrollableDiv,
  layoutName: Ember.computed(function() { return 'components/' + this.get('template'); }),
  scrollContainer: Ember.computed(function() { return $(this.element).find('ul.babble-posts') }),

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
    messageBus.subscribe('/babble', function(data) {
      var post = Discourse.Post.create(data)
      post.set('topic', self.get('topic'))
      self.get('topic.postStream').appendPost(post)
      if(Discourse.User.current().id == post.user_id) { self.scroll() }
    })
  },

  scroll: function() {
    var container = this.get('scrollContainer')
    if (!container.length) { return }

    container.animate({ scrollTop: this.getLastReadLinePosition() })
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
