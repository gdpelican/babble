import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    this.state  = widget.state
    return [this.composer(), this.sendButton()]
  },

  composer() {
    return h('div.babble-composer-wrapper', [this.textarea(), this.emojiButton()])
  },

  textarea() {
    return h('textarea', {
      attributes: {
        placeholder: Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'),
        rows:        this.state.editing ? 1 : 2,
        disabled:    this.state.submitDisabled
      }
    })
  },

  emojiButton() {
    return this.widget.attach('button', {
      className: 'emoji',
      icon: 'smile-o',
      action: 'selectEmoji'
    })
  },

  sendButton(state) {
    return this.widget.attach('button', {
      className: 'btn btn-primary btn-submit pull-right',
      action: 'submit',
      label: 'babble.send',
      attributes: { disabled: this.state.submitDisabled }
    })
  }
})
