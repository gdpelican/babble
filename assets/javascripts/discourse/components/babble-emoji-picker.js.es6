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
  },

  emojiSelected(code) {
    const $textarea = $('.babble-composer-wrapper textarea');
    $textarea.val($textarea.val() + ` :${code}:`)
    Discourse.__container__.lookup('app-events:main').trigger('babble-emoji-picker:close')
  }
})
