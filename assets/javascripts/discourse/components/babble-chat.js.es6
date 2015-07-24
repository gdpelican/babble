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

  // Sorry Discourse.scrolling, you force me to use document and window
  // for my scrolly elements and that's no good here.
  _inserted: function() {
    var self = this
    var containerElement = $(self.element).find('ul.babble-posts')
    var lastSeenPost = function() {
      var lastReadPostNumber = _.max(_.map(containerElement.find('.babble-post-container'), function(post) {
        var postElement = $(post)
        if (self.isElementInScrollableDiv(postElement.parent(), containerElement)) { return postElement.data('post-number') }
      }))
      if (lastReadPostNumber > self.get('topic.last_read_post_number')) {
        console.log(lastReadPostNumber)
      }
    }
    lastSeenPost = Discourse.debounce(lastSeenPost, 500)
    containerElement.on('scroll', lastSeenPost)
    lastSeenPost()
  }.on('didInsertElement')
});
