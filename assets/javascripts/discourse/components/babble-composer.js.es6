import { showSelector } from "discourse/lib/emoji/emoji-toolbar";

export default Ember.Component.extend({
  classNames: ['babble-post-composer'],

  _init: function() {
    this.set('placeholder', Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'))
  }.on('init'),

  keyDown: function(event) {
    this.set('showError', false)
    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      if (!this.get('submitDisabled')) { // ignore if submit is disabled
        this._actions.submit(this) // submit on enter
      }
      return false
    }
  },

  textValidation: function() {
    var validation = { ok: true }
    if (this.get('processing') || Ember.isEmpty(this.get('text'))) {
      var validation = { failed: true }
    }

    return Discourse.InputValidation.create(validation)
  }.property('text', 'processing'),

  submitDisabled: function() {
    if (this.get('textValidation.failed')) return true
  }.property('textValidation'),

  actions: {
    selectEmoji: function() {
      var self = this
      var c = showModal('smileypicker')      
      c.setProperties({ composerView: self })
      $('.smileypicker-box img').on('click', function() {
        var title = $(this).attr('title')
        self.set('text', (self.get('text') || '').trimRight() + ' :' + title + ':')

        $('.modal, .modal-outer-container').remove()
        $('body, textarea').off('keydown.emoji')
        $('.babble-post-composer textarea').focus()
        return false
      })
    },

    submit: function(context) {
      var self = context || this;

      if (self.get('text').trim() === "") {
        self.set('showError', true)
        self.set('text', '')
        return
      }

      self.set('processing', true)
      Discourse.ajax("/babble/topic/post", {
        type: 'POST',
        data: { raw: self.get('text').trim() }
      })
      .then(Discourse.Babble.refresh)
      .finally(function() {
        self.set('text', '')
        self.set('processing', false)
      });
    }
  }

});
