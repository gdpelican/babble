export default {
  resource: 'discovery',
  path: '/chat',
  map() {
    this.resource('chat', {path: '/'}, function() {
      this.route('showCategory', {path: '/:category/:id'});
    })
  }
};
