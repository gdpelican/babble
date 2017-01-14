import { createWidget } from 'discourse/widgets/widget'
import { showSelector } from "discourse/lib/emoji/toolbar"
import Babble from "../lib/babble"
import template from "../widgets/templates/babble-composer"
import { ajax } from 'discourse/lib/ajax'
import debounce from 'discourse/lib/debounce'

export default createWidget('babble-composer', {
  tagName: 'div.babble-post-composer',

  defaultState(attrs) {
    return {
      editing:         attrs.isEditing,
      submitDisabled:  attrs.submitDisabled,
      post:            attrs.post,
      topic:           attrs.topic,
      raw:             attrs.raw
    }
  },

  composerElement() {
    if (this.state.editing) {
      return $('.babble-post-container > .babble-post-composer textarea')
    } else {
      return $('.babble-chat > .babble-post-composer textarea')
    }
  },

  selectEmoji() {
    let $composer = this.composerElement()
    showSelector({
      register: this.register,
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

  cancel() {
    Babble.editPost(null)
  },

  submit() {
    let $composer = this.composerElement(),
        text = $composer.val();
    $composer.val('')
    if (!text) { return; }

    if (this.state.editing) {
      this.update(text)
    } else {
      this.create(text)
    }
  },

  create(text) {
    this.state.submitDisabled = true
    Babble.createPost(this.state.topic, text).finally(() => {
      this.state.submitDisabled = false
    })
  },

  update(text) {
    if (this.state.post.raw.trim() == text.trim()) { return }
    Babble.updatePost(this.state.post, this.state.topic, text).finally(() => {
      this.state.submitDisabled = false
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
      Babble.editPost(null)
      return false
    }
  },

  keyUp(event) {
    if (this.state.showError) { this.state.showError = false }
    if (event.keyCode == 38 &&                               // key pressed is up key
        !this.state.editing &&                               // post is not being edited
        !$(event.target).siblings('.autocomplete').length) { // autocomplete is not active
      let myLastPost = _.last(_.select(this.state.topic.postStream.posts, function(post) {
        return post.user_id == Discourse.User.current().id
      }))
      if (myLastPost) { Babble.editPost(myLastPost) }
      return false
    }

    // only fire typing events if input has changed
    // TODO: expand this to account for backspace / delete keys too
    if (event.key.length === 1) { this.announcePresence() }
  },

  announcePresence: debounce(function() {
    ajax(`/babble/topics/${this.state.topic.id}/presence`, { type: 'POST' })
  }, 250),

  html() { return template.render(this) }
})
