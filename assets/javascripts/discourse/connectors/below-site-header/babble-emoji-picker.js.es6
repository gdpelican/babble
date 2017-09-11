export default {
  actions: {
    emojiSelected(code) {
      const textarea = $('.babble-composer-wrapper textarea');
      textarea.val(textarea.val() + `:${code}:`);
    }
  }
}
