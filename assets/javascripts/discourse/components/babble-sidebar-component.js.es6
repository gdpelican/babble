import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'
import { on, observes } from 'ember-addons/ember-computed-decorators'
import { ajax } from 'discourse/lib/ajax'
import { setupLiveUpdate } from '../lib/chat-live-update-utils'

export default MountWidget.extend({
  widget: 'babble-sidebar',

  buildArgs() {
    return {
      topic:              this.topic,
      mobile:             this.site.isMobileDevice,
      availableTopics:    this.availableTopics,
      lastReadPostNumber: (this.topic || {}).last_read_post_number,
      visible:            this.visible,
      csrf:               this.session.get('csrfToken')
    }
  },

  @on('didInsertElement')
  _initialize() {
    if (Babble.disabled()) { return }
    if (Discourse.User.current() === null) { return }

    this.set('targetObject', this)

    $(window).on('resize.babble-window-resize', _.debounce(() => { this.rerenderWidget() }, 250))

    if (Discourse.SiteSettings.babble_adaptive_height) {
      $(window).on('scroll.babble-scroll', _.throttle(() => { this.rerenderWidget() }, 250))
    }

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

    this.appEvents.on('babble-rerender', () => {
      this.rerenderWidget()
    })

    ajax('/babble/topics.json').then((data) => {
      this.set('availableTopics', data.topics.map((t) => { return Babble.buildTopic(t) }))
    })

    ajax('/babble/topics/default.json').then((data) => {
      this.set('topic', Babble.buildTopic(data))
      setupLiveUpdate(this.topic, { 'posts': ((data) => { Babble.handleNewPost(this.topic, data) }) })
      this.appEvents.trigger("babble-default-registered", this.topic)
    }, console.log)
  },

  @on('willDestroyElement')
  _teardown() {
    $(window).off('resize.babble-window-resize')
    $(window).off('scroll.babble-scroll')
    this.appEvents.off('babble-go-to-post')
    this.appEvents.off('babble-toggle-chat')
    this.appEvents.off('babble-upload-init')
    this.appEvents.off('babble-upload-success')
    this.appEvents.off('babble-upload-failure')
    this.appEvents.off('babble-rerender')
  },

  @observes('visible')
  _updateOutletClass() {
    const $outlet = $('#main-outlet')
    if (this.visible) {
      $outlet.addClass(`chat-active--${Discourse.SiteSettings.babble_position}`)
    } else {
      $outlet.removeClass(`chat-active--${Discourse.SiteSettings.babble_position}`)
    }
    this.appEvents.trigger('babble-update-visible', this.visible)
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
