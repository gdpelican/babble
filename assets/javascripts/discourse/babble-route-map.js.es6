export default {
  resource: 'discovery',
  path: '/chat',
  map() {
    this.resource('chat', {path: '/'}, function() {
      this.route('showCategory', {path: '/c/:category'});
      this.route('showParentCategory', {path: '/c/:parent_category/:category'});
    })
  }
};
