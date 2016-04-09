import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import userSearch from "discourse/lib/user-search";
import expanding from "../lib/expanding"

export default Ember.Component.extend({
  userSearch: userSearch,
  classNames: ['babble-post-composer'],

  _init: function() {
    this.set('placeholder', Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'))
    if (this.get('post')) { this.set('text', this.get('post.raw')) }
  }.on('init'),

  _didInsertElement: function() {
    const self = this
    let $textarea = self.$('textarea')

    if (this.get('editing')) { expanding.initialize($textarea) }

    $textarea.autocomplete({
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

    $textarea.autocomplete({
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
    if (event.keyCode == 38 && !this.get('editing')) {
      let myLastPost = _.last(_.select(this.get('topic.postStream.posts'), function(post) {
        return post.user_id == Discourse.User.current().id
      }))
      if (myLastPost) { Discourse.Babble.set('editingPostId', myLastPost.id) }
      return false
    }

    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      if (!this.get('submitDisabled')) { // ignore if submit is disabled
        this._actions[this.get('composerAction')](this) // submit on enter
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
    return this.get('textValidation.failed') ||
           this.get('text') == this.get('post.raw')
  }.property('textValidation'),

  composerAction: function() {
    if (this.get('post.id'))  { return 'update' }
    if (this.get('topic.id')) { return 'create' }
  }.property('post', 'topic'),

  editing: function() {
    return this.get('composerAction') == 'update'
  }.property('composerAction'),

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

    create: function(composer) {
      const self = composer || this
      const text = self.get('text').trim()
      if (!text) { self.set('errorMessage', 'babble.error_message'); return; }
      self.set('text', '')

      self.set('processing', true)
      Discourse.Babble.stagePost(text)
      Discourse.ajax(`/babble/topics/${self.get('topic.id')}/post`, {
        type: 'POST',
        data: { raw: text }
      }).then(Discourse.Babble.handleNewPost, () => {
        Discourse.Babble.clearStagedPost()
        self.set('errorMessage', 'babble.failed_post')
      }).finally(() => {
        self.set('processing', false)
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
      }).then(() => {
        Discourse.Babble.set('editingPostId', null)
      }, () => {
        self.set('errorMessage', 'babble.failed_post')
      }).finally(() => {
        self.set('processing', false)
      })
    },

    cancel: function() {
      Discourse.Babble.set('editingPostId', null)
    }
  }

});
