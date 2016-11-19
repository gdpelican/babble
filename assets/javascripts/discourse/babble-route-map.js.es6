export default function() {
  this.resource('discovery', {path: '/chat'}, function() {
    this.resource('chat', {path: '/'}, function() {
      this.route('showCategory', {path: '/:category/:id'});
      this.route('showCategoryNear', {path: '/:category/:id/:post_number'});
    })
  })
  this.resource('topic', {path: '/t/chat/:slug/:id'}, function() {
    this.route('redirect', {path: '/'});
    this.route('redirectNear', {path: '/:nearPost'});
  })
};
