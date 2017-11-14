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

      api.modifyClass("controller:upload-selector", {
        uploadElement() {
          return $(this.toolbarEvent.target)
        },

        @on('init')
        _prepareBabbleUpload() {
          Ember.run.scheduleOnce('afterRender', () => {
            if (!this.get('babble')) { return }
            const csrf = encodeURIComponent(this.session.get('csrfToken'))
            this.uploadElement().fileupload({
              url: Discourse.getURL(`/uploads.json?client_id=${this.messageBus.clientId}&authenticity_token=${csrf}`),
              dataType: "json",
              pasteZone: this.uploadElement()
            })
          })
        },

        @on('willDestroyElement')
        _teardownBabbleUpload() {
          if (!this.get('babble')) { return }
          this.uploadElement().fileupload('destroy')
        },

        actions: {
          upload() {
            if (!this.get('babble')) { return this._super() }

            this._pasted = false

            const $element = this.uploadElement()

            $element.fileupload('add', { fileInput: $('#filename-input') })

            $element.on('fileuploadpaste', () => {
              this._pasted = true
            })

            $element.on('fileuploadsubmit', (_, data) => {
              data.formData = { type: 'composer', pasted: this._pasted }
              this.appEvents.trigger('babble-upload-init', data)
            })

            $element.on("fileuploadprogressall", (e, data) => {
              this.appEvents.trigger('babble-upload-progress', data)
            })

            $element.on("fileuploadfail", (e, data) => {
              this.messageBus.unsubscribe("/uploads/composer")
              this.appEvents.trigger('babble-upload-failure')
            })

            this.messageBus.subscribe("/uploads/composer", upload => {
              this.messageBus.unsubscribe("/uploads/composer")
              if (upload && upload.url) {
                this.appEvents.trigger('babble-upload-success', getUploadMarkdown(upload))
              } else {
                this.appEvents.trigger('babble-upload-failure')
              }
              this.send('closeModal')
            })
          }
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
