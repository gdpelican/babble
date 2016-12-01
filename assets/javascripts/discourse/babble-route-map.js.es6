export default function() {
  this.route('discovery', {path: '/chat', resetNamespace: true}, function() {
    this.route('chat', {path: '/', resetNamespace: true}, function() {
      this.route('showCategory', {path: '/:category/:id'});
      this.route('showCategoryNear', {path: '/:category/:id/:post_number'});
    })
  })
  this.route('topic', {path: '/t/chat/:slug/:id', resetNamespace: true}, function() {
    this.route('redirect', {path: '/'});
    this.route('redirectNear', {path: '/:nearPost'});
  })
};
