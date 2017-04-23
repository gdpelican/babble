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
    return h('div.babble-composer-wrapper', [this.typing(), this.textarea(), this.emojiButton()])
  },

  typing() {
    if (this.state.post) { return }
    return this.widget.attach('babble-typing', { topic: this.state.topic })
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

  emojiButton() {
    return this.widget.attach('button', {
      className: 'emoji-button',
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
