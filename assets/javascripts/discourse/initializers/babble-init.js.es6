import { withPluginApi } from 'discourse/lib/plugin-api';
import Babble from "../lib/babble";
import SiteHeader from 'discourse/components/site-header';
import NavigationBar from 'discourse/components/navigation-bar';
import { ajax } from 'discourse/lib/ajax';
import Category from 'discourse/models/category';

export default {
  name: 'babble-init',
  initialize(){
    if (!Discourse.User.current()) { return }

    if (Discourse.SiteSettings.babble_full_page) {
      // Add full page chat to category breadcrumbs
      NavigationBar.reopen({
        actions: {
          toggleChat() {
            let category = this.get('targetObject.category')
            let url = Discourse.getURL(["", "chat", Category.slugFor(category), category.get('chat_topic_id')].join('/'))
            DiscourseURL.routeTo(url)
          }
        },

        showChatToggle: function() {
          return this.get('targetObject.category.chat_topic_id')
        }.property('targetObject.category.chat_topic_id'),

        chatIsActive: function() {
          return this.get('targetObject.isChat')
        }.property('targetObject.isChat')
      })

    } else {
      // Add shoutbox widget to header
      ajax('/babble/topics.json').then(
        (data)  => { Babble.setAvailableTopics(data) },
        (error) => { console.log(error) }
      )

      ajax('/babble/topics/default.json').then(
        (data)  => { Babble.setCurrentTopic(data) },
        (error) => {
          if (error.status === 404) { console.log('No chat channels are available') }
          else                      { console.log(error) }
        }
      )

      SiteHeader.reopen({

        didInsertElement() {
          this._super();
          Babble.set('header', this)
        },

        afterPatch() {
          Babble.setupAfterRender()
        }
      })

      withPluginApi('0.1', api => {
        api.decorateWidget('header-icons:before', function(helper) {
          let headerState = helper.widget.parentWidget.state
          let contents    = []

          if (!Babble.disabled() &&
          api.getCurrentUser() &&
          Discourse.SiteSettings.babble_enabled) {
            contents.push(helper.attach('header-dropdown', {
              title:         'babble.title',
              icon:          Discourse.SiteSettings.babble_icon,
              iconId:        'babble-icon',
              active:        headerState.babbleVisible,
              action:        'toggleBabble',
              contents() {
                if (!Babble.notificationCount() || headerState.babbleVisible) { return }
                return this.attach('link', {
                  action:    'toggleBabble',
                  className: 'badge-notification unread-notifications',
                  rawLabel:  Babble.notificationCount()
                })
              }
            }));
          }
          if (headerState.babbleVisible) {
            if (headerState.babbleViewingChat === undefined) {
              headerState.babbleViewingChat = true
            }
            contents.push(helper.attach('babble-menu', {
              topic:              Babble.get('currentTopic'),
              availableTopics:    Babble.getAvailableTopics(true),
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

          Babble.editPost(null)

          this.state.babbleVisible = !this.state.babbleVisible
        })

        api.attachWidgetAction('header', 'toggleBabbleViewingChat', function() {
          this.state.babbleViewingChat = !this.state.babbleViewingChat
        })
      })
    }
  }
}
