import { queryRegistry } from 'discourse/widgets/widget'
import { withPluginApi } from 'discourse/lib/plugin-api'
import reopenWidget      from '../lib/reopen-widget'
import Babble            from '../lib/babble'
import { ajax }          from 'discourse/lib/ajax'
import { on, observes }  from 'ember-addons/ember-computed-decorators'

export default {
  name: 'babble-common-init',
  initialize() {
    withPluginApi('0.8.9', api => {
      let _super = queryRegistry('notification-item').prototype.url
      api.reopenWidget('notification-item', {
        url() {
          if (!this.attrs.data.chat) { return _super.apply(this) }
          return `/chat/${this.attrs.slug}/${this.attrs.topic_id}/${this.attrs.post_number}`
        }
      })

      api.modifyClass("component:site-header", {
        @on('didInsertElement')
        listenForBabble() {
          this.appEvents.on("babble-default-registered", () => { this.queueRerender() })
        }
      })

      api.modifyClass("component:babble-sidebar-component", {
        @on('didInsertElement')
        initialize() {
          if (Babble.disabled()) { return }

          ajax('/babble/topics/default.json').then((data) => {
            Babble.bind(this, Babble.buildTopic(data))

            api.decorateWidget('header-icons:before', function(helper) {
              return helper.attach('header-dropdown', {
                title:         'babble.title',
                icon:          Discourse.SiteSettings.babble_icon,
                iconId:        'babble-icon',
                action:        'toggleBabble'
              })
            })
            api.attachWidgetAction('header',    'toggleBabble', () => { this.toggle() })
            api.attachWidgetAction(this.widget, 'toggleBabble', () => { this.toggle() })
            this.appEvents.trigger("babble-default-registered")
          }, console.log)
        },

        toggle() {
          this.set('visible', !this.visible)
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
