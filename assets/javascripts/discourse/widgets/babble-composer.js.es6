import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import { showSelector } from "discourse/lib/emoji/emoji-toolbar";

export default createWidget('babble-composer', {
  tagName: 'div.babble-post-composer',

  defaultState(attrs) {
    return {
      editing: attrs.isEditing,
      submitDisabled: attrs.submitDisabled,
      post: attrs.post,
      topic: attrs.topic,
      lastInteraction: new Date(0)
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
        var $composer = $('.babble-post-composer textarea'),
            text = $composer.val();
        text = text.trimRight() + ' :' + emoji + ':'
        $composer.val(text)
        $('.emoji-modal, .emoji-modal-wrapper').remove()
        $composer.focus()
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
    var $composer = $('.babble-post-composer textarea'),
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
    var topic = this.state.topic
    Discourse.Babble.stagePost(text)
    Discourse.Babble.set('submitDisabled', true)
    Discourse.Babble.toggleProperty('postStreamUpdated')
    Discourse.ajax(`/babble/topics/${topic.id}/post`, {
      type: 'POST',
      data: { raw: text }
    })
  },

  update(text) {
    var post = this.state.post
    Discourse.Babble.set('editingPostId', null)
    Discourse.Babble.set('loadingEditId', post.id)
    this.scheduleRerender()
    Discourse.ajax(`/babble/topics/${post.topic_id}/post/${post.id}`, {
      type: 'POST',
      data: { raw: text }
    })
  },

  keyUp(event) {
    this.state.showError = false
    this.checkInteraction()
    if (event.keyCode == 38 && !this.state.editing) {
      let myLastPost = _.last(_.select(this.state.topic.postStream.posts, function(post) {
        return post.user_id == Discourse.User.current().id
      }))
      if (myLastPost) { Discourse.Babble.set('editingPostId', myLastPost.id) }
      return false
    }

    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      event.preventDefault()
      if (!this.state.submitDisabled) { // ignore if submit is disabled
        this.submit(this) // submit on enter
      }
      return false
    }
  },

  checkInteraction() {
    const topic = this.state.topic
    const lastInteraction = this.state.lastInteraction
    const now = new Date
    if (now - lastInteraction > 5000) {
      this.state.lastInteraction = now
      Discourse.ajax(`/babble/topics/${topic.id}/notification`, {
        type: 'POST',
        data: {state: 'editing'}
      })
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

  html(attrs){
    const placeholder = Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'),
          attributes = {'placeholder': placeholder, 'rows': 1};
    if (this.state.submitDisabled) {attributes.disabled = true}
    var contents = [
      this.attach('button', {
        className: 'emoji',
        icon: 'smile-o',
        action: 'selectEmoji'}),
      h('textarea', {attributes: attributes})
    ]
    return contents
  }
})
