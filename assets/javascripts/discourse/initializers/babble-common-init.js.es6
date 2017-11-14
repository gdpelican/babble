import { queryRegistry } from 'discourse/widgets/widget'
import { withPluginApi } from 'discourse/lib/plugin-api'
import reopenWidget      from '../lib/reopen-widget'
import Babble            from '../lib/babble'
import { ajax }          from 'discourse/lib/ajax'
import { on, observes }  from 'ember-addons/ember-computed-decorators'
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import { getUploadMarkdown, validateUploadedFiles } from 'discourse/lib/utilities'

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

      api.modifyClass("component:user-card-contents", {
        @on('didInsertElement')
        listenForBabble() {
          this.appEvents.on("babble-toggle-chat", () => {
            Ember.run.scheduleOnce('afterRender', () => {
              if ($('.babble-sidebar').length) {
                $('.babble-sidebar').on('click.discourse-user-card', '[data-user-card]', (e) => {
                  if (wantsNewWindow(e)) { return }
                  const $target = $(e.currentTarget)
                  return this._show($target.data('user-card'), $target)
                })
                $('.babble-sidebar').on('click.discourse-user-mention', 'a.mention', (e) => {
                  if (wantsNewWindow(e)) { return }
                  const $target = $(e.target)
                  return this._show($target.text().replace(/^@/, ''), $target)
                })

              } else {
                $('.babble-sidebar').off('click.discourse-user-card')
              }
            })
          })
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
    })
  }
}
