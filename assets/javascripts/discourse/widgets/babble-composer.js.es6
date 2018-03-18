import { createWidget } from 'discourse/widgets/widget'
import Babble from "../lib/babble"
import template from "../widgets/templates/babble-composer"
import { ajax } from 'discourse/lib/ajax'
import { messageBus } from '../lib/chat-live-update-utils'
import { getUploadMarkdown } from 'discourse/lib/utilities'

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
      raw:             attrs.raw,
      csrf:            attrs.csrf
    }
  },

  composerElement() {
    if (this.state.editing) {
      return $('.babble-post-container .babble-post-composer textarea')
    } else {
      return $('.babble-chat > .babble-post-composer textarea')
    }
  },

  selectEmoji() {
    this.appEvents.trigger("babble-emoji-picker:open", this.composerElement())
  },

  uploadFile(toolbarEvent) {
    const $element = $(toolbarEvent.target)
    const $input = $('#babble-file-input')

    $element.fileupload({
      url: Discourse.getURL(`/uploads.json?client_id=${messageBus().clientId}&authenticity_token=${this.state.csrf}`),
      dataType: "json",
      pasteZone: $element
    })

    $element.on('fileuploadsubmit', (_, data) => {
      this.state.submitDisabled = true
      data.formData = { type: 'composer' }
      this.scheduleRerender()
    })

    $element.on("fileuploadprogressall", (_, data) => {
      // progress!
    })

    $element.on("fileuploadfail", () => {
      this.state.submitDisabled = undefined
      this.scheduleRerender()
    })

    $element.on("fileuploaddone", (e, data) => {
      $element.fileupload('destroy')
      this.state.submitDisabled = undefined
      let upload = data.result
      if (upload && upload.url) {
        Babble.createPost(this.state.topic, getUploadMarkdown(upload))
      } else {
        // failure :(
      }
      this.scheduleRerender()
    })

    Ember.run.scheduleOnce('afterRender', () => {
      $input.on('change', () => {
        $element.fileupload('add', { fileInput: $input })
        $input.off('change')
      })
      $input.click()
    })
  },

  cancel() {
    Babble.editPost(this.state.topic, null)
  },

  isEmptyEdit() {
    return this.composerElement().val() == this.state.post.raw.trim()
  },

  submit() {
    if (!this.composerElement().val()) { return }
    this.state.editing ? this.update() : this.create()
    this.composerElement().val('')
  },

  create() {
    let text = this.composerElement().val()
    this.state.submitDisabled = true
    Babble.createPost(this.state.topic, text).finally(() => {
      this.state.submitDisabled = undefined
      Ember.run.scheduleOnce('afterRender', () => { this.composerElement().focus() })
    })
  },

  update() {
    let text = this.composerElement().val()
    if (this.isEmptyEdit()) {
      this.state.topic.editingPostId = null
    } else {
      Babble.updatePost(this.state.topic, this.state.post, text).finally(() => {
        this.state.submitDisabled = undefined
      })
    }
  },

  keyDown(event) {
    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      if (this.state.submitDisabled) { return }
      event.preventDefault()
      // submit on enter
      this.submit()
      return false
    } else if (event.keyCode == 27) {
      event.preventDefault()
      Babble.editPost(this.state.topic, null)
      return false
    }
  },

  keyUp(event) {
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
  }, 2000),

  html() { return template.render(this) }
})
