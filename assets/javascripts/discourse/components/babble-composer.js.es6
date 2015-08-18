
export default Ember.Component.extend({
  classNames: ['babble-post-composer'],

  _init: function() {
    this.set('placeholder', I18n.t('babble.placeholder'))
  }.on('init'),

  keyDown: function(event) {
    if (event.keyCode == 13) {
      this._actions.submit(this) // submit on enter
      return false
    }
  },

  textValidation: function() {
    var validation = { ok: true }
    if (Ember.isEmpty(this.get('text'))) {
      var validation = { failed: true }
    }

    return Discourse.InputValidation.create(validation)
  }.property('text'),

  submitDisabled: function() {
    if (this.get('textValidation.failed')) return true
  }.property('textValidation'),

  actions: {
    submit: function(context) {
      var self = context || this;
      Discourse.ajax("/babble/topic/post", {
        type: 'POST',
        data: { raw: self.get('text') }
      }).then(function(data) {
        Discourse.Babble.refresh(data)
        self.set('text', '')
      });
    }
  }

});
