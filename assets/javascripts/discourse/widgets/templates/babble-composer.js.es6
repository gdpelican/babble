import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    this.state  = widget.state
    return [this.composer(), this.sendButton(), this.cancelButton()]
  },

  composer() {
    return h('div.babble-composer-wrapper', [this.textarea(), this.emojiButton()])
  },

  textarea() {
    return h('textarea', {
      attributes: {
        'babble-composer': 'inactive',
        placeholder: Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'),
        rows:        this.state.editing ? 1 : 2,
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

  sendButton() {
    return this.widget.attach('button', {
      className: 'btn btn-primary btn-submit pull-right',
      action: 'submit',
      label: this.state.editing ? 'babble.save' : 'babble.send',
      attributes: { disabled: this.state.submitDisabled }
    })
  },

  cancelButton() {
    if (!this.state.editing) { return }
    return this.widget.attach('button', {
      className: 'btn btn-cancel pull-right',
      action: 'cancel',
      label: 'babble.cancel'
    })
  }
})
