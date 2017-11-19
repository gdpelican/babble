import EmojiPicker from 'discourse/components/emoji-picker'
import { on }  from 'ember-addons/ember-computed-decorators'

export default EmojiPicker.extend({
  automaticPositioning: false,

  @on('didInsertElement')
  listenForBabble() {
    this.appEvents.on('babble-emoji-picker:open', ($target) => {
      this.set('active', true)
      this.show()
    })
    this.appEvents.on('babble-emoji-picker:close', () => {
      this.close()
      this.set('active', false)
    })
    $('html').on('keydown.babble-emoji-picker', e => {
      if (e.which != 27) { return }
      this.appEvents.trigger('babble-emoji-picker:close')
    })
    $('html').on('click.babble-emoji-picker', e => {
      if ($(e.target).closest('.babble-emoji-picker').length) { return }
      this.appEvents.trigger('babble-emoji-picker:close')
    })
  },

  @on('willDestroyElement')
  cleanupBabble() {
    this.appEvents.off('babble-emoji-picker:open')
    this.appEvents.off('babble-emoji-picker:close')
    $('html').off('keydown.babble-emoji-picker')
    $('html').off('click.babble-emoji-picker')
  },

  emojiSelected(code) {
    const $textarea = $('.babble-composer-wrapper textarea')
    $textarea.val($textarea.val() + ` :${code}:`)
    Discourse.__container__.lookup('app-events:main').trigger('babble-emoji-picker:close')
  }
})
