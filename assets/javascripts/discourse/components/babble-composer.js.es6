import Presence from 'discourse/mixins/presence';

export default Ember.Component.extend(Presence, {
  classNames: ['babble-post-composer'],

  textValidation: function() {
    var validation = { ok: true };
    if (this.blank('text')) {
      var validation = { failed: true };
    }

    return Discourse.InputValidation.create(validation);
  }.property('text'),

  submitDisabled: function() {
    if (this.get('textValidation.failed')) return true;
  }.property('textValidation'),

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
