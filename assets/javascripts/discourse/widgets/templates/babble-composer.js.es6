import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    this.state  = widget.state
    if (Discourse.User.current()) {
      return this.composer()
    } else {
      return this.loggedOutView()
    }
  },

  composer() {
    return h('div.babble-composer-wrapper', [this.textarea(), this.actions()])
  },

  actions() {
    return h('div.babble-composer-actions', [this.uploadButton(), this.uploadFile(), this.emojiButton()])
  },

  textarea() {
    return h('textarea', {
      attributes: {
        'babble-composer': 'inactive',
        placeholder: Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'),
        rows:        1,
        disabled:    this.state.submitDisabled
      }
    }, this.state.raw)
  },

  uploadFile() {
    return h('input#babble-file-input', { type: 'file' })
  },

  uploadButton() {
    if (this.state.editing) { return }
    return this.widget.attach('button', {
      className: 'babble-composer-action upload-button',
      icon: 'paperclip',
      action: 'uploadFile',
      sendActionEvent: true
    })
  },

  emojiButton() {
    return this.widget.attach('button', {
      className: 'babble-composer-action emoji-button',
      icon: 'smile-o',
      action: 'selectEmoji'
    })
  },

  loggedOutView() {
    return [
      h('div.babble-logged-out-message', I18n.t('babble.logged_out')),
      this.widget.attach('header-buttons', {
        canSignUp: this.widget.attrs.canSignUp,
        showLogin: null,
        showSignUp: null,
      })
    ]
  }
})
