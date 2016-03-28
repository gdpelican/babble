import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import userSearch from "discourse/lib/user-search";

export default Ember.Component.extend({
  userSearch: userSearch,
  classNames: ['babble-post-composer'],

  _init: function() {
    this.set('placeholder', Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'))
  }.on('init'),

  _didInsertElement: function() {
    const self = this
    self.$('textarea').autocomplete({
      template: self.container.lookup('template:emoji-selector-autocomplete.raw'),
      key: ":",

      transformComplete(v) {
        if (!v.code) { return }
        return `${v.code}:`
      },

      dataSource(term) {
        return new Ember.RSVP.Promise(resolve => {
          term = term.toLowerCase()
          var options = (term === "" && ['smile', 'smiley', 'wink', 'sunny', 'blush']) ||
                        Discourse.Emoji.translations[`:${term}`] ||
                        Discourse.Emoji.search(term, {maxResults: 5})
          return resolve(options)
        }).then(list => list.map(code => {
          return {code, src: Discourse.Emoji.urlFor(code)};
        }))
      }
    })

    self.$('textarea').autocomplete({
      template: self.container.lookup('template:user-selector-autocomplete.raw'),
      key: '@',
      dataSource(term) {
        return self.userSearch({
          term: term,
          topicId: self.get('topic.id'),
          includeGroups: true,
          exclude: [Discourse.User.current().get('username')]
        })
      },
      transformComplete(v) {
        return v.username || v.name
      }
    })
  }.on('didInsertElement'),

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

  _eventToggleFor: function(selector, event, namespace) {
    let elem = $(selector)
    let handler = _.find($._data(elem[0], 'events')[event], function(e) {
      return e.namespace == namespace
    })
    return {
      element: elem,
      handler: handler,
      on: function() {  elem.on(`${event}.${namespace}`, handler) },
      off: function() { elem.off(`${event}.${namespace}`) }
    }
  },

  actions: {
    selectEmoji: function() {
      const self              = this
      const outsideClickEvent = self._eventToggleFor('html', 'click', 'close-menu-panel')
      const escKeyEvent       = self._eventToggleFor('body', 'keydown', 'discourse-menu-panel')

      outsideClickEvent.off()
      escKeyEvent.off()

      showSelector({
        container: this.container,
        onSelect: function(emoji) {
          self.set('text', (self.get('text') || '').trimRight() + ' :' + emoji + ':')

          $('.emoji-modal, .emoji-modal-wrapper').remove()
          $('.babble-post-composer textarea').focus()
          outsideClickEvent.on()
          escKeyEvent.on()
          return false
        }
      })

      $('.emoji-modal-wrapper').on('click', function(event) {
        outsideClickEvent.on()
        escKeyEvent.on()
        event.stopPropagation()
      })
      $('body').on('keydown.emoji', function(event) {
        if (event.which != 27) { return; }
        outsideClickEvent.on()
        escKeyEvent.on()
        event.stopPropagation()
      })
    },

    submit: function(context) {
      const self = context || this;
      const text = self.get('text').trim()
      self.set('text', '')

      if (text === '') {
        self.set('errorMessage', 'babble.error_message')
      } else {
        self.set('processing', true)
        Discourse.Babble.stagePost(text)
        Discourse.ajax("/babble/topics/" + self.get('topic.id') + "/post", {
          type: 'POST',
          data: { raw: text }
        })
        .then(Discourse.Babble.handleNewPost, function() {
          Discourse.Babble.clearStagedPost()
          self.set('errorMessage', 'babble.failed_post')
        })
        .finally(function() { self.set('processing', false) });
      }
    }
  }

});
