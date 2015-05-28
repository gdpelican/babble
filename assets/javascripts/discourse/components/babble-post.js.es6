
export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['babble-post'],

  userDeleted: Em.computed.empty('post.user_id'),
  
  setupPost: function() {
    this.set('post', Discourse.Post.create(this.post));
    var post = this.get('post')
    if (!post.read) { post.set("read", true) }
  }.on('init')

});
