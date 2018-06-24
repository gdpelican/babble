import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'
import { on, observes } from 'ember-addons/ember-computed-decorators'
import { setupLiveUpdate } from '../lib/chat-live-update-utils'

export default MountWidget.extend({
  widget: 'babble-sidebar',
  availableTopics: [],
  availableUsers: [],

  buildArgs() {
    return {
      topic:              this.topic,
      mobile:             this.site.isMobileDevice,
      availableTopics:    this.availableTopics,
      availableUsers:     this.availableUsers,
      lastReadPostNumber: (this.topic || {}).last_read_post_number,
      visible:            (this.initialized && this.visible),
      csrf:               this.session.get('csrfToken')
    }
  },

  @on('didInsertElement')
  _initialize() {
    if (Babble.disabled()) { return }
    if (Discourse.User.current() === null) { return }

    this.set('targetObject', this)

    $(window).on('resize.babble-window-resize', _.debounce(() => {
      this.appEvents.trigger('babble-rerender')
    }, 250))

    if (Discourse.SiteSettings.babble_adaptive_height) {
      $(window).on('scroll.babble-scroll', _.throttle(() => {
        this.appEvents.trigger('babble-rerender')
      }, 250))
    }

    this.appEvents.on("babble-go-to-post", ({topicId, postNumber}) => {
      Babble.loadTopic(topicId, { postNumber }).then((topic) => {
        this.openChat(topic, postNumber)
      }, console.log)
    })

    this.appEvents.on("babble-toggle-chat", (topic, postNumber) => {
      if (!this.visible) {
        this.openChat(topic, postNumber)
      } else {
        this.closeChat()
      }
    })

    this.appEvents.on("babble-upload-success", (markdown) => {
      Babble.createPost(this.topic, markdown)
    })

    this.appEvents.on('babble-rerender', () => {
      this.rerenderWidget()
    })

    this.appEvents.on('babble-initialize', (topic, postNumber) => {
      if (this.initialized) { return }
      this.set('initialized', true)

      Babble.loadAvailableTopics().then((topics) => {
        this.set('availableTopics', topics)
        if (this.availableTopics.length == 1) {
          this.topic = this.availableTopics[0]
        }
        if (this.availableTopics.length > 0) {
          this.appEvents.trigger('babble-toggle-chat', topic, postNumber)
        }
      })

      Babble.loadAvailableUsers().then((users) => {
        this.set('availableUsers', users)
        this.appEvents.trigger('babble-rerender')
      })
    })

    if (!this.site.isMobileDevice && Discourse.SiteSettings.babble_open_by_default) {
      this.appEvents.trigger("babble-initialize")
    }
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
    this.rerenderWidget()
  },

  openChat(topic, postNumber) {
    if (this.initialized) {
      if (this.visible) { this.closeChat() }
      if (topic) { this.set('topic', topic) }
      this.set('visible', true)
      Babble.bind(this, this.topic, postNumber)
    } else {
      this.appEvents.trigger('babble-initialize', topic, postNumber)
    }
  },

  closeChat() {
    this.set('visible', false)
    Babble.unbind(this)
  }
})
