import Post from "discourse/models/post"
import Topic from "discourse/models/topic"

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['babble-post'],

  isStaged: Em.computed.equal('post.id', -1),
  userDeleted: Em.computed.empty('post.user_id'),

  _init: function() {
    this.set('post', Post.create(this.post))
    this.set('post.topic', Topic.create(this.topic))
    this.set('isLastRead', this.get('post.post_number') <   this.get('post.topic.highest_post_number') &&
                           this.get('post.post_number') === this.get('post.topic.last_read_post_number'))
  }.on('init')

});
