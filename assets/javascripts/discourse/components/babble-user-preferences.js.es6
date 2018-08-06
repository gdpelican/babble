export default Ember.Component.extend({
  actions: {
    toggleChat() {
      this.user.save(['custom_fields'])
    }
  }
})
