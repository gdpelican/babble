import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import userSearch from "discourse/lib/user-search";

export default Ember.Component.extend({
  userSearch: userSearch,
  classNames: ['babble-post-composer'],
  showUpload: false,
  uploadProgress: 0,
  _xhr: null,

  _init: function() {
    this.set('placeholder', Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'))
  }.on('init'),

  _didInsertElement: function() {
    this._bindUploadTarget();
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

  uploadPlaceholder: function() {
    return `[${I18n.t('uploading')}]() `;
  }.property(),

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
      // add upload placeholders (as much placeholders as valid files dropped)
      const placeholder = _.times(this._validUploads, () => uploadPlaceholder).join("\n");
      this._addText(this._getSelected(), placeholder);

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
          this.set('text', this.get('text').replace(uploadPlaceholder, markdown));
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

  _addTextFromMenu: function() {
    this._addText(this._getSelected(), this.get('addText'))
  }.observes('addText'),

  _addText: function(sel, text) {
    const insert = `${sel.pre}${text}`;
    this.set('text', `${insert}${sel.post}`);
    this._selectText(insert.length, 0);
    Ember.run.scheduleOnce("afterRender", () => this.$("textarea").focus());
  },

  _selectText: function(from, length) {
    Ember.run.scheduleOnce('afterRender', () => {
      const $textarea = this.$('textarea');
      const textarea = $textarea[0];
      const oldScrollPos = $textarea.scrollTop();
      if (!this.capabilities.isIOS) {
        $textarea.focus();
      }
      textarea.selectionStart = from;
      textarea.selectionEnd = textarea.selectionStart + length;
      $textarea.scrollTop(oldScrollPos);
    });
  },

  _getSelected: function(trimLeading) {
    const textarea = this.$('textarea')[0];
    const value = textarea.value;
    var start = textarea.selectionStart;
    let end = textarea.selectionEnd;

    // trim trailing spaces cause **test ** would be invalid
    while (end > start && /\s/.test(value.charAt(end-1))) {
      end--;
    }

    if (trimLeading) {
      // trim leading spaces cause ** test** would be invalid
      while(end > start && /\s/.test(value.charAt(start))) {
        start++;
      }
    }

    const selVal = value.substring(start, end);
    const pre = value.slice(0, start);
    const post = value.slice(end);

    return { start, end, value: selVal, pre, post };
  },

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
