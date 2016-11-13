export default function() {
  this.resource('discovery', {path: '/chat'}, function() {
    this.resource('chat', {path: '/'}, function() {
      this.route('showCategory', {path: '/:category/:id'});
    })
  })
  this.resource('topic', {path: '/t/chat/:slug/:id'}, function() {
    this.resource('redirect', {path: '/'}, function() {
      this.route('chat', {path: '/:post_id'});
    })
  })
};
