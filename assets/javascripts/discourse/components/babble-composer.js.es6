export default Ember.Component.extend({
  classNames: ['babble-post-composer'],

  actions: {
    submit: function() {
      var _this = this;
      Discourse.ajax("/babble/posts", { 
        type: 'POST', 
        data: { raw: this.get('text') }
      }).then(function() {
        _this.set('text', '')
      });
    }
  }

});
