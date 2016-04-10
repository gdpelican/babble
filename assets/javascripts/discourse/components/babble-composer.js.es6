import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import userSearch from "discourse/lib/user-search";
import expanding from "../lib/expanding"

export default Ember.Component.extend({
  userSearch: userSearch,
  classNames: ['babble-post-composer'],
  showUpload: false,
  uploadProgress: 0,
  _xhr: null,

  _init: function() {
    this.set('placeholder', Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'))
    if (this.get('post')) { this.set('text', this.get('post.raw')) }
  }.on('init'),

  _didInsertElement: function() {
    this._bindUploadTarget();
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
        this._submit(this) // submit on enter
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

  _bindUploadTarget: function() {
    this._unbindUploadTarget();

    const $element = this.$();
    const csrf = this.session.get('csrfToken');
    const uploadPlaceholder = this.get('uploadPlaceholder');

    $element.fileupload({
      url: Discourse.getURL(`/uploads.json?client_id=${this.messageBus.clientId}&authenticity_token=${encodeURIComponent(csrf)}`),
      dataType: "json",
      pasteZone: $element,
    });

    $element.on('fileuploadsubmit', (e, data) => {
      const isUploading = Discourse.Utilities.validateUploadedFiles(data.files);
      data.formData = { type: "composer" };
      this.setProperties({ uploadProgress: 0, isUploading });
      return isUploading;
    });

    $element.on("fileuploadprogressall", (e, data) => {
      this.set("uploadProgress", parseInt(data.loaded / data.total * 100, 10));
    });

    $element.on("fileuploadsend", (e, data) => {
      this._validUploads++;
      if (data.xhr && data.originalFiles.length === 1) {
        this.set("isCancellable", true);
        this._xhr = data.xhr();
      }
    });

    $element.on("fileuploadfail", (e, data) => {
      this._resetUpload(true);

      const userCancelled = this._xhr && this._xhr._userCancelled;
      this._xhr = null;

      if (!userCancelled) {
        Discourse.Utilities.displayErrorForUpload(data);
      }
    });

    this.messageBus.subscribe("/uploads/composer", upload => {
      // replace upload placeholder
      if (upload && upload.url) {
        if (!this._xhr || !this._xhr._userCancelled) {
          const markdown = Discourse.Utilities.getUploadMarkdown(upload);
          this._submit(null, markdown);
          this._resetUpload(false);
          this.set('showUpload', false)
        } else {
          this._resetUpload(true);
        }
      } else {
        this._resetUpload(true);
        Discourse.Utilities.displayErrorForUpload(upload);
      }
    });
  },

  _resetUpload: function(removePlaceholder) {
    this._validUploads--;
    if (this._validUploads === 0) {
      this.setProperties({ uploadProgress: 0, isUploading: false, isCancellable: false });
    }
    if (removePlaceholder) {
      this.set('text', this.get('text').replace(this.get('placeholder'), ""));
    }
  },

  _unbindUploadTarget: function() {
    this._validUploads = 0;
    this.messageBus.unsubscribe("/uploads/composer");
    const $uploadTarget = this.$();
    try { $uploadTarget.fileupload("destroy"); }
    catch (e) { }
    $uploadTarget.off();
  }.on('willDestroyElement'),

  _submitLinkedImage: function() {
    this._submit(null, this.get('linkedImage'))
  }.observes('linkedImage'),

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

  _submit: function(composer, image, update) {
    const self = composer || this;
    const text = image || self.get('text').trim()
    if (!text) { self.set('errorMessage', 'babble.error_message'); return; }
    if (!image) {self.set('text', '')}
    self.set('processing', true)

    if (update) {
      this._update(self, text)
    } else {
      this._create(self, text)
    }
  },

  _create: function(self, text) {
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

  _update: function(self, text) {
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
      this._submit(composer, false)
    },

    update: function(composer) {
      this._submit(composer, true)
    },

    cancel: function() {
      Discourse.Babble.set('editingPostId', null)
    },

    upload: function() {
      this.set('showUpload', true)
    },

    cancelUpload: function() {
      if (this._xhr) {
        this._xhr._userCancelled = true;
        this._xhr.abort();
      }
      this._resetUpload(true);
    },
  }

});
