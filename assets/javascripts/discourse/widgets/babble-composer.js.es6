import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import { showSelector } from "discourse/lib/emoji/emoji-toolbar";

export default createWidget('babble-composer', {
  tagName: 'babble-post-composer',

  defaultState(attrs) {
    return {
      processing: false,
      editing: false,
      submitDisabled: false,
      errorMessage: '',
      text: '',
      post: null,
      topic: attrs.topic
    }
  },

  selectEmoji() {
    const self = this,
          outsideClickEvent = self.eventToggleFor('html', 'click', 'close-menu-panel'),
          escKeyEvent = self.eventToggleFor('body', 'keydown', 'discourse-menu-panel');

    outsideClickEvent.off()
    escKeyEvent.off()

    showSelector({
      container: self.container,
      onSelect: function(emoji) {
        self.state.text = self.state.text.trimRight() + ' :' + emoji + ':'

        $('.emoji-modal, .emoji-modal-wrapper').remove()
        $('.babble-post-composer textarea').focus()
        outsideClickEvent.on()
        escKeyEvent.on()
        return false
      }
    })

    $('.emoji-modal-wrapper').on('click', function(event) {
      outsideClickEvent.on()
      escKeyEvent.on()
      event.stopPropagation()
    })
    $('body').on('keydown.emoji', function(event) {
      if (event.which != 27) { return; }
      outsideClickEvent.on()
      escKeyEvent.on()
      event.stopPropagation()
    })
  },

  cancel() {
    Discourse.Babble.set('editingPostId', null)
  },

  eventToggleFor(selector, event, namespace) {
    let elem = $(selector)
    let handler = _.find($._data(elem[0], 'events')[event], function(e) {
      return e.namespace == namespace
    })
    return {
      element: elem,
      handler: handler,
      on: function() { elem.on(`${event}.${namespace}`, handler)},
      off: function() { elem.off(`${event}.${namespace}`) }
    }
  },

  submit() {
    var text = $('.babble-post-composer-textarea textarea').val()
    this.state.text = text
    if (!text) { this.state.errorMessage = 'babble.error_message'; return; }

    this.state.processing = true
    if (this.state.editing) {
      this.update(text)
    } else {
      this.create(text)
    }
  },

  create(text) {
    this.state.text = ''
    console.log(this.state)
    var topic = this.state.topic
    Discourse.Babble.stagePost(text)
    Discourse.ajax(`/babble/topics/${topic.id}/post`, {
      type: 'POST',
      data: { raw: text }
    }).then(Discourse.Babble.handleNewPost, () => {
      Discourse.Babble.clearStagedPost()
      this.state.errorMessage = 'babble.failed_post'
    }).finally(() => {
      this.state.processing = false
    });
  },

  update(text) {
    var post = this.state.post
    Discourse.ajax(`/babble/topics/${post.topic_id}/post/${post.id}`, {
      type: 'POST',
      data: { raw: text }
    }).then(() => {
      Discourse.Babble.set('editingPostId', null)
    }, () => {
      this.state.errorMessage = 'babble.failed_post'
    }).finally(() => {
      this.state.processing = false
    })
  },

  keyUp(event) {
    this.state.showError = false
    if (event.keyCode == 38 && !this.state.editing) {
      let myLastPost = _.last(_.select(this.state.topic.postStream.posts, function(post) {
        return post.user_id == Discourse.User.current().id
      }))
      if (myLastPost) { Discourse.Babble.set('editingPostId', myLastPost.id) }
      return false
    }

    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      if (!this.state.submitDisabled) { // ignore if submit is disabled
        this.submit(this) // submit on enter
      }
      return false
    }
  },

  eventToggleFor(selector, event, namespace) {
    let elem = $(selector)
    let handler = _.find($._data(elem[0], 'events')[event], function(e) {
      return e.namespace == namespace
    })
    return {
      element: elem,
      handler: handler,
      on: function() {  elem.on(`${event}.${namespace}`, handler) },
      off: function() { elem.off(`${event}.${namespace}`) }
    }
  },

  html(){
    const editing = this.state.editing,
          submitDisabled = this.state.submitDisabled,
          text = this.state.text,
          placeholder = Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'),
          errorMessage = this.state.errorMessage;
    var wrapperClass = ['header-dropdown-toggle']
    if (editing) {wrapperClass.push('is-editing')}
    var contents = [
      h('div.babble-post-composer-textarea', h('textarea', {
          attributes: {
            'value': text,
            'placeholder': placeholder,
            'rows': 1
          }
        })
      )
    ]

    if (errorMessage.length) {contents.push(h('span.babble-composer-error-message'), I18n.t(errorMessage))}

    if (editing) {
      contents.push(h('div.babble-composer-editing-buttons', [
          this.attach('button', {
            className: 'btn btn-primary',
            label: 'babble.save',
            action: 'submit',
            disabled: submitDisabled}),
          this.attach('button', {
            className: 'btn cancel',
            label: 'babble.cancel',
            action: 'cancel'})
        ]
      ))
    } else {
      contents.push(
        this.attach('button', {
          className: 'babble-submit btn btn-primary',
          label: 'babble.send',
          action: 'submit',
          disabled: submitDisabled})
      )
    }
    contents.push(
      this.attach('button', {
        className: 'btn no-text emoji',
        icon: 'smile-o',
        action: 'selectEmoji'})
    )

    return contents
  }
})
