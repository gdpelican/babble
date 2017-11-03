import { queryRegistry } from 'discourse/widgets/widget'
import { withPluginApi } from 'discourse/lib/plugin-api'
import reopenWidget      from '../lib/reopen-widget'
import Babble            from '../lib/babble'
import { ajax }          from 'discourse/lib/ajax'
import { on, observes }  from 'ember-addons/ember-computed-decorators'
import DiscourseLocation from 'discourse/lib/discourse-location'

export default {
  name: 'babble-common-init',
  initialize() {
    withPluginApi('0.8.9', api => {

      let _super = queryRegistry('notification-item').prototype.url
      api.reopenWidget('notification-item', {
        url() {
          if (!this.attrs.data.chat_topic_id) { return _super.apply(this) }
          return `${location.pathname}?chat_topic_id=${this.attrs.data.chat_topic_id}&post_id=${this.attrs.data.original_post_id}`
        }
      })

      api.modifyClass("component:site-header", {
        @on('didInsertElement')
        listenForBabble() {
          this.appEvents.on("babble-default-registered", () => {
            api.decorateWidget('header-icons:before', function(helper) {
              return helper.attach('header-dropdown', {
                title:         'babble.title',
                icon:          Discourse.SiteSettings.babble_icon,
                iconId:        'babble-icon',
                action:        'toggleBabble'
              })
            })

            api.attachWidgetAction(this.widget, 'toggleBabble', () => {
              this.appEvents.trigger("babble-toggle-chat")
            })

            this.queueRerender()
          })
        }
      })

      api.modifyClass("component:babble-sidebar-component", {
        @on('didInsertElement')
        initialize() {
          if (Babble.disabled()) { return }

          this.appEvents.on("babble-go-to-post", (topicId, postId) => {
            this.goToPost(topicId, postId)
          })

          this.appEvents.on("babble-toggle-chat", () => {
            this.set('visible', !this.visible)
          })

          ajax('/babble/topics/default.json').then((data) => {
            Babble.bind(this, Babble.buildTopic(data))

            api.attachWidgetAction(this.widget, 'toggleBabble', () => {
              this.appEvents.trigger("babble-toggle-chat")
            })

            this.appEvents.trigger("babble-default-registered")
          }, console.log)
        },

        goToPost(topicId, postId) {
          ajax(`/babble/topics/${topicId}?near_post=${postId}`).then((data) => {
            this.set('visible', false)
            Babble.bind(this, Babble.buildTopic(data))
            this.appEvents.trigger("babble-toggle-chat")
          })
        }
      })

      api.modifyClass("component:emoji-picker", {
        @on('didInsertElement')
        addOpenEvent() {
          this.appEvents.on("emoji-picker:open",  () => { this.set("active", true) })
          this.appEvents.on("emoji-picker:close", () => { this.set("active", false) })
        },

        @on('willDestroyElement')
        removeOpenEvent() {
          this.appEvents.off("emoji-picker:open")
          this.appEvents.off("emoji-picker:close")
        },

        @observes('active')
        triggerAttrUpdate() {
          this._setState()
        },
      })
    })
  }
}
