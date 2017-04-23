import { createWidget } from 'discourse/widgets/widget'
import { showSelector } from "discourse/lib/emoji/toolbar"
import Babble from "../lib/babble"
import template from "../widgets/templates/babble-composer"
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-composer', {
  tagName: 'div.babble-post-composer',

  buildKey(attrs) {
    return `babble-composer-${attrs.topic.id}`
  },

  defaultState(attrs) {
    return {
      submitDisabled:  attrs.submitDisabled,
      post:            attrs.post,
      topic:           attrs.topic,
      raw:             attrs.raw
    }
  },

  composerElement() {
    if (this.state.post) {
      return $('.babble-post-container > .babble-post-composer textarea')
    } else {
      return $('.babble-chat > .babble-post-composer textarea')
    }
  },

  selectEmoji() {
    let $composer = this.composerElement()
    showSelector({
      onSelect: function(emoji) {
        $composer.val(`${$composer.val().trimRight()} :${emoji}:`)
        $composer.focus()
        $('.emoji-modal, .emoji-modal-wrapper').remove()
        return false
      }
    })

    $('.emoji-modal-wrapper').on('click', (e) => { e.stopPropagation() })
    $('body').on('keydown.emoji',         (e) => { e.stopPropagation() })
  },

  submit() {
    let $composer = this.composerElement(),
        text = $composer.val();
    $composer.val('')
    if (!text) { return; }

    if (this.state.post) {
      this.update(text)
    } else {
      this.create(text)
    }
  },

  create(text) {
    this.state.submitDisabled = true
    Babble.createPost(this.state.topic, text).finally(() => {
      this.state.submitDisabled = undefined
      Ember.run.scheduleOnce('afterRender', () => { this.composerElement().focus() })
    })
  },

  update(text) {
    if (this.state.post.raw.trim() == text.trim()) { return }
    Babble.updatePost(this.state.topic, this.state.post, text).finally(() => {
      this.state.submitDisabled = undefined
    })
  },

  keyDown(event) {
    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      if (this.state.submitDisabled) { return }
      event.preventDefault()
      this.submit() // submit on enter
      return false
    } else if (event.keyCode == 27) {
      event.preventDefault()
      Babble.clearEditing(this.state.topic)
      return false
    }
  },

  keyUp(event) {
    if (this.state.showError) { this.state.showError = false }
    if (event.keyCode == 38 &&                               // key pressed is up key
        !this.state.post &&                                  // post is not being edited
        !$(event.target).siblings('.autocomplete').length) { // autocomplete is not active
      Babble.editMyLastPost(this.state.topic)
      return false
    }

    // only fire typing events if input has changed
    // TODO: expand this to account for backspace / delete keys too
    if ((event.key || '').length === 1) { this.announceTyping() }
  },

  announceTyping: _.throttle(function() {
    ajax(`/babble/topics/${this.state.topic.id}/typing`, { type: 'POST' })
  }, 1000),

  html() { return template.render(this) }
})
