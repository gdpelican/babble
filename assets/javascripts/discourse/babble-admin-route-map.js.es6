export default {
  resource: 'admin',
  map() {
    this.resource('adminChats', { path: '/chats' }, function() {
      this.resource('adminChat', { path: '/:id' });
    });
  }
};
