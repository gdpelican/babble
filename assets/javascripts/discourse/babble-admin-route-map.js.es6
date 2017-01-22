export default {
  resource: 'admin',
  map() {
    this.route('adminChats', { path: '/chats', resetNamespace: true }, function() {
      this.route('adminChat', { path: '/:id', resetNamespace: true });
    });
  }
};
