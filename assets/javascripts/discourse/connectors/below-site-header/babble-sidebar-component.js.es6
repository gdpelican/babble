export default {
  setupComponent(args, component) {
    component.emojiSelected = () => {
      console.log('wark!')
      const $textarea = $('.babble-composer-wrapper textarea')
      $textarea.val($textarea.val() + ` :${code}:`)
      Discourse.__container__.lookup('app-events:main').trigger('babble-emoji-picker:close')
    }
  }
}
