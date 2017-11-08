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

      let _click = queryRegistry('notification-item').prototype.click
      let _url   = queryRegistry('notification-item').prototype.url
      api.reopenWidget('notification-item', {
        click(e) {
          _click.apply(this, [e])
          this.appEvents.trigger("babble-go-to-post", {
            topicId: this.attrs.data.chat_topic_id,
            postNumber:  this.attrs.data.post_number
          })
        },

        url() {
          if (this.attrs.data.chat_topic_id) {
            // we don't want to navigate anywhere for chat events, we'll
            // open the sidebar automatically when we need to
            return ""
          }
          return _url.apply(this)
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
