import { createWidget } from 'discourse/widgets/widget'
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
    this.appEvents.trigger("emoji-picker:open");
  },

  cancel() {
    Babble.editPost(this.state.topic, null)
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
      Babble.editPost(this.state.topic, null)
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
      if (myLastPost) { Babble.editPost(this.state.topic, myLastPost) }
      return false
    }

    // only fire typing events if input has changed
    // TODO: expand this to account for backspace / delete keys too
    if (event.key && event.key.length === 1) { this.announceTyping() }
  },

  announceTyping: _.throttle(function() {
    ajax(`/babble/topics/${this.state.topic.id}/typing`, { type: 'POST' })
  }, 1000),

  html() { return template.render(this) }
})
