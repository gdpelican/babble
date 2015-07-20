
export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['babble-post'],

  userDeleted: Em.computed.empty('post.user_id'),

  setupPost: function() {
    this.set('post', Discourse.Post.create(this.post))
    this.set('post.topic', Discourse.Topic.create(this.topic))
    this.set('isLastRead', this.get('post.post_number') === this.get('post.topic.last_read_post_number'))
  }.on('init')

});
