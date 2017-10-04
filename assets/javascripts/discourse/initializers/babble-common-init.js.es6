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
          if (this.get('isBabble')) {
            this.appEvents.on('babble-emoji-picker:open', () => this.set('active', true));
          }
        },

        @on('willDestroyElement')
        removeOpenEvent() {
          if (this.get('isBabble')) this.appEvents.off('babble-emoji-picker:open');
        },
 
        @observes('active')
        triggerAttrUpdate() {
          this._setState();
        },
          
        _positionPicker() {
          if (!this.get('isBabble')) return this._super();

          let windowWidth = this.$(window).width();

          let attributes = {
            width: Math.min(windowWidth, 400) - 12,
            marginLeft: -(Math.min(windowWidth, 400)/2) + 6,
            marginTop: -130,
            left: "50%",
            bottom: "",
            top: "50%",
            display: "flex"
          };

          this.$(".emoji-picker-modal").addClass("fadeIn");
          this.$(".emoji-picker").css(attributes);
        }
      })
    })
  }
}
