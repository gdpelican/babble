
export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['babble-post'],

  userDeleted: Em.computed.empty('post.user_id'),
  
  setupPost: function() {
    this.set('post', Discourse.Post.create(this.post));
  }.on('init'),

  actions: {
    expandHidden: function() { return false; }
  }

});
