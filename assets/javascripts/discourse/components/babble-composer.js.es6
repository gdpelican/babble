
export default Ember.Component.extend({
  classNames: ['babble-post-composer'],

  actions: {
    submit: function() {
      Discourse.ajax("/babble/posts", { 
        type: 'POST', 
        data: { raw: this.get('text') }
      }).then(function() {
        console.log('success!')
      });
    }
  }

});
