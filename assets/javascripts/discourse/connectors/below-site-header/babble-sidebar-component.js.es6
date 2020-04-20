const appEvents = Discourse.__container__.lookup('service:app-events')

export default {
  setupComponent(args, component) {
    appEvents.on('babble-emoji-picker:open', this, $composer => {
      this.set('active', true)
      this.set('emojiSelected', code => {
        $composer.val($composer.val() + ` :${code}:`)
        this.set('active', false)
      })
    })
    $('html').on('keydown.babble-emoji-picker', e => {
      if (e.which != 27) { return }
      this.set('active', false)
    })
    $('html').on('click.babble-emoji-picker', e => {
      if ($(e.target).closest('.babble-emoji-picker').length) { return }
      this.set('active', false)
    })
  },

  teardownComponent(args, component) {
    appEvents.off('babble-emoji-picker:open')
    $('html').off('keydown.babble-emoji-picker')
    $('html').off('click.babble-emoji-picker')
  }
}
