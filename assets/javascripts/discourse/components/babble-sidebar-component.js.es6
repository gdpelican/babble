import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'
import { on, observes } from 'ember-addons/ember-computed-decorators'
import { ajax } from 'discourse/lib/ajax'

export default MountWidget.extend({
  widget: 'babble-sidebar',

  buildArgs() {
    return {
      topic:              this.topic,
      availableTopics:    this.availableTopics,
      lastReadPostNumber: (this.topic || {}).last_read_post_number,
      visible:            this.visible
    }
  },

  @on('didInsertElement')
  _initialize() {
    if (Babble.disabled()) { return }

    this.set('targetObject', this)

    this.appEvents.on("babble-go-to-post", ({topicId, postNumber}) => {
      this.goToPost(topicId, postNumber)
    })

    this.appEvents.on("babble-toggle-chat", (topic) => {
      if (!this.visible) {
        this.open(topic)
      } else {
        this.close()
      }
    })

    this.appEvents.on("babble-upload-init", () => {

    })

    this.appEvents.on("babble-upload-success", (markdown) => {
      Babble.createPost(this.topic, markdown)
    })

    this.appEvents.on("babble-upload-failure", () => {

    })

    ajax('/babble/topics.json').then((data) => {
      this.set('availableTopics', data.topics.map((t) => { return Babble.buildTopic(t) }))
    })

    ajax('/babble/topics/default.json').then((data) => {
      this.set('topic', Babble.buildTopic(data))
      this.appEvents.trigger("babble-default-registered")
    }, console.log)
  },

  @observes('visible')
  _updateOutletClass() {
    const $outlet = $('#main-outlet')
    if (this.visible) {
      $outlet.addClass('chat-active')
    } else {
      $outlet.removeClass('chat-active')
    }
    this.rerenderWidget()
  },

  goToPost(topicId, postNumber) {
    ajax(`/babble/topics/${topicId}?near_post=${postNumber}`).then((data) => {
      this.open(Babble.buildTopic(data), postNumber)
    }, console.log)
  },

  open(topic, postNumber) {
    if (this.visible) { this.close() }
    if (topic) { this.set('topic', topic) }
    this.set('visible', true)
    Babble.bind(this, this.topic, postNumber)
  },

  close() {
    this.set('visible', false)
    Babble.unbind(this)
  },

  closeChat() {
    this.close()
  },

  viewChat(topic, postNumber) {
    this.open(topic, postNumber)
  }
})
