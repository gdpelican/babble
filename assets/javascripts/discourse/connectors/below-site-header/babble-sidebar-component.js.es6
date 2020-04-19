const appEvents = Discourse.__container__.lookup('app-events:main')

export default {
  setupComponent(args, component) {
    component.emojiSelected = code => {
      appEvents.trigger('babble-emoji-picker:select', code)
    }
  }
}
