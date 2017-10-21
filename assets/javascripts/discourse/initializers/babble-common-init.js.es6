import { queryRegistry } from 'discourse/widgets/widget'
import { withPluginApi } from 'discourse/lib/plugin-api'
import reopenWidget      from '../lib/reopen-widget'
import { on, observes }  from 'ember-addons/ember-computed-decorators'

export default {
  name: 'babble-common-init',
  initialize() {
    // sorry mom
    withPluginApi('0.8.9', api => {
      let _super = queryRegistry('notification-item').prototype.url
      api.reopenWidget('notification-item', {
        url() {
          if (!this.attrs.data.chat) { return _super.apply(this) }
          return `/chat/${this.attrs.slug}/${this.attrs.topic_id}/${this.attrs.post_number}`
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
