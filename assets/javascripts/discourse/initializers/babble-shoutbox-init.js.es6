import Babble from '../lib/babble'
import SiteHeader from 'discourse/components/site-header'
import { ajax } from 'discourse/lib/ajax'
import { withPluginApi } from 'discourse/lib/plugin-api'

export default {
  name: 'babble-shoutbox-init',
  initialize() {
    if (!Discourse.SiteSettings.babble_shoutbox) { return }

    ajax('/babble/topics.json').then((data) => {
      let availableTopics = data.topics.map((data) => { return Babble.buildTopic(data) })
      if (!availableTopics.length) { console.log('No topics available!'); return }

      ajax('/babble/topics/default.json').then((data) => {
        let defaultTopic = Babble.buildTopic(data)

        SiteHeader.reopen({
          selector: '#main header.d-header',
          topic: defaultTopic,

          didInsertElement() {
            this._super()
            Babble.bind(this)
          },

          didRemoveElement() {
            this._super()
            Babble.unbind(this)
          }
        })

        withPluginApi('0.1', api => {
          api.decorateWidget('header-icons:before', function(helper) {
            let headerState   = helper.widget.parentWidget.state
            if (!headerState.babbleTopic) { headerState.babbleTopic = defaultTopic }

            let contents = []
            if (!Babble.disabled() &&
                api.getCurrentUser() &&
                headerState.babbleTopic &&
                Discourse.SiteSettings.babble_enabled) {
              contents.push(helper.attach('header-dropdown', {
                title:         'babble.title',
                icon:          Discourse.SiteSettings.babble_icon,
                iconId:        'babble-icon',
                active:        headerState.babbleVisible,
                action:        'toggleBabble',
                contents() {
                  if (!headerState.babbleTopic.unreadCount || headerState.babbleVisible) { return }
                  return this.attach('link', {
                    action:    'toggleBabble',
                    className: 'badge-notification unread-notifications',
                    rawLabel:  headerState.babbleTopic.visibleUnreadCount
                  })
                }
              }));
            }
            if (headerState.babbleVisible) {
              if (headerState.babbleViewingChat === undefined) {
                headerState.babbleViewingChat = true
              }
              contents.push(helper.attach('babble-menu', {
                availableTopics:       availableTopics,
                viewingChat:           headerState.babbleViewingChat,
                topic:                 headerState.babbleTopic
              }))
            }
            return contents
          })

          api.attachWidgetAction('header', 'toggleBabble', function() {
            Babble.editPost(this.state.babbleTopic, null)
            this.state.babbleVisible = !this.state.babbleVisible
          })

          api.attachWidgetAction('header', 'toggleBabbleViewingChat', function(topic) {
            if (topic) { this.state.babbleTopic = topic }
            this.state.babbleViewingChat = !this.state.babbleViewingChat
          })
        })
      }, console.log)
    }, console.log)
  }
}
