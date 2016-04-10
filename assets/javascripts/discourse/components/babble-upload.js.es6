import { default as computed, on, observes } from 'ember-addons/ember-computed-decorators';
import { uploadTranslate } from 'discourse/controllers/upload-selector';

export default Ember.Component.extend({
  tagName: "div",
  classNameBindings: [':babble-upload', ':babble-modal', 'visible::hidden'],
  local: true,
  imageUrl: null,
  showMore: false,
  remote: Ember.computed.not("local"),

  @on('didInsertElement')
  @observes('local')
  selectedChanged() {
    Ember.run.next(() => {
      // *HACK* to select the proper radio button
      const value = this.get('local') ? 'local' : 'remote';
      $('input:radio[name="upload"]').val([value]);
      $('.inputs input:first').focus();
    });
  },

  @computed()
  title() {
    return uploadTranslate("title");
  },

  close: function() {
    this.set('visible', false)
  },

  actions: {
    upload: function() {
      const $composer = this.$().parent().siblings('.babble-post-composer')
      if (this.get('local')) {
        $composer.fileupload('add', { fileInput: this.$('#filename-input') });
      } else {
        const imageUrl = this.get('imageUrl') || '';
        const imageLink = imageUrl.substr(imageUrl.lastIndexOf('/') + 1)
        this.sendAction('sendLinkedImage', `![${imageLink}](${imageUrl})`)
      }
      this.close()
    },

    closeModal: function() {
      this.close()
    },

    useLocal: function() {
      this.setProperties({ local: true, showMore: false});
    },

    useRemote: function() {
      this.set("local", false);
    },
  }

});
