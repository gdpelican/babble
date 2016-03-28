import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import userSearch from "discourse/lib/user-search";

export default Ember.Component.extend({
  userSearch: userSearch,
  classNames: ['babble-post-composer'],

  _init: function() {
    this.set('placeholder', Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'))
    if (this.get('post')) { this.set('text', this.get('post.raw')) }
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

  composerAction: function() {
    if (this.get('post.id'))  { return 'update' }
    if (this.get('topic.id')) { return 'create' }
  }.property('post', 'topic'),

  editing: function() {
    return this.get('composerAction') == 'update'
  }.property('composerAction'),

  submitText: function() {
    if (this.get('composerAction') == 'create') {
      return 'babble.send'
    } else {
      return 'babble.save'
    }
  }.property('composerAction'),

  actions: {
    selectEmoji: function() {
      var self = this
      var closeMenuPanelHandler = _.find($._data($('html')[0], 'events')['click'], function(e) {
        return e.namespace == 'close-menu-panel'
      }) // sorry mom.

      $('html').off('click.close-menu-panel')
      $('.emoji-modal-wrapper').on('click', function() {
        $('html').on('click.close-menu-panel', closeMenuPanelHandler.handler)
      })

      showSelector({
        container: this.container,
        onSelect: function(emoji) {
          self.set('text', (self.get('text') || '').trimRight() + ' :' + emoji + ':')

          $('.emoji-modal, .emoji-modal-wrapper').remove()
          $('.babble-post-composer textarea').focus()
          $('html').on('click.close-menu-panel', closeMenuPanelHandler.handler)
          return false
        }
      })
    },

    create: function(composer) {
      const self = composer || this
      const text = self.get('text').trim()
      if (!text) { self.set('errorMessage', 'babble.error_message'); return; }
      self.set('text', '')

      this.set('processing', true)
      Discourse.Babble.stagePost(text)
      Discourse.ajax(`/babble/topics/${this.get('topic.id')}/post`, {
        type: 'POST',
        data: { raw: text }
      }).then(Discourse.Babble.handleNewPost, () => {
        Discourse.Babble.clearStagedPost()
        this.set('errorMessage', 'babble.failed_post')
      }).finally(() => {
        this.set('processing', false)
      });
    },

    update: function(composer) {
      const self = composer || this
      const text = self.get('text').trim()
      if (!text) { self.set('errorMessage', 'babble.error_message'); return; }

      self.set('processing', true)
      Discourse.ajax(`/babble/topics/${self.get('post.topic_id')}/post/${self.get('post.id')}`, {
        type: 'POST',
        data: { raw: text }
      }).then(() => {}, () => {
        self.set('errorMessage', 'babble.failed_post')
      }).finally(() => {
        self.set('processing', false)
      })
    },

    cancel: function() {
      this.set('context.isEditing', false)
    }
  }

});
