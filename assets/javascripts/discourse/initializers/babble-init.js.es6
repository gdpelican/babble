import { withPluginApi } from 'discourse/lib/plugin-api';
import Babble from "../lib/babble";
import SiteHeader from 'discourse/components/site-header';
import autosize from 'discourse/lib/autosize';
import { default as computed, on, observes } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'babble-init',
  initialize(){

    Discourse.ajax('/babble/topics.json').then(
      (data)  => { Babble.setAvailableTopics(data) },
      (error) => { console.log(error) }
    )

    Discourse.ajax('/babble/topics/default.json').then(
      (data)  => { Babble.setCurrentTopic(data) },
      (error) => {
        if (e.status === 404) { console.log('No chat channels are available') }
        else                  { console.log(error) }
      }
    )

    SiteHeader.reopen({

      didInsertElement() {
        this._super();
        Babble.set('header', this)
      },

      afterPatch() {
        Ember.run.scheduleOnce('afterRender', () => {
          const $scrollContainer = this.$('.babble-list[scroll-container=inactive]')
          if ($scrollContainer.length) {
            Babble.setScrollContainer($scrollContainer)
            Babble.scrollTo(Babble.currentTopic.last_read_post_number, 0)
          }

          const $textarea = this.$('.babble-post-container .babble-post-composer textarea')
          if ($textarea.length) {
            if (!$textarea.val()) {
              const editingId = Babble.editingPostId
              if (editingId) {
                var post = Babble.currentTopic.postStream.findLoadedPost(editingId)
                $textarea.val(post.raw)
                autosize($textarea)
              } else {
                $textarea.css('height', 'initial')
              }
            } else {
              autosize($textarea)
            }
          }
        })
      }
    })

    withPluginApi('0.1', api => {
      api.decorateWidget('header-icons:before', function(helper) {
        let headerState = helper.widget.parentWidget.state
        let contents    = []

        if (!helper.widget.site.mobileView &&
            !Babble.disabled() &&
            api.getCurrentUser() &&
            Discourse.SiteSettings.babble_enabled) {
          contents.push(helper.attach('header-dropdown', {
            title:         'babble.title',
            icon:          Discourse.SiteSettings.babble_icon,
            iconId:        'babble-icon',
            active:        headerState.babbleVisible,
            action:        'toggleBabble',
            contents() {
              if (!Babble.get('unreadCount') || headerState.babbleVisible) { return }
              return this.attach('link', {
                action:    'toggleBabble',
                className: 'badge-notification unread-notifications',
                rawLabel:  Babble.get('unreadCount')
              })
            }
          }));
        }
        if (headerState.babbleVisible) {
          if (headerState.babbleViewingChat === undefined) {
            headerState.babbleViewingChat = true
          }
          contents.push(helper.attach('babble-menu', {
            viewingChat:        headerState.babbleViewingChat,
            lastReadPostNumber: headerState.lastReadPostNumber
          }))
        }
        return contents
      })

      api.attachWidgetAction('header', 'toggleBabble', function() {
        let topic = Babble.currentTopic
        if (topic.last_read_post_number < topic.highest_post_number) {
          this.state.lastReadPostNumber = topic.last_read_post_number
        } else {
          this.state.lastReadPostNumber = null
        }

        this.state.babbleVisible = !this.state.babbleVisible
      })

      api.attachWidgetAction('header', 'toggleBabbleViewingChat', function() {
        this.state.babbleViewingChat = !this.state.babbleViewingChat
      })

    })
  }
}
