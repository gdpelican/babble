import Babble from '../lib/babble'
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
                container:             $('.babble-menu'),
                topic:                 headerState.babbleTopic
              }))
            }
            return contents
          })

          api.attachWidgetAction('header', 'toggleBabble', function() {
            this.state.babbleVisible = !this.state.babbleVisible
            Babble.editPost(topic, null)
          })

          api.attachWidgetAction('header', 'toggleBabbleViewingChat', function(topic) {
            this.state.babbleViewingChat = !this.state.babbleViewingChat
            if (topic) { this.state.babbleTopic = topic }
          })
        })
      }, console.log)
    }, console.log)
  }
}
