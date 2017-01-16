import Babble from '../lib/babble'
import SiteHeader from 'discourse/components/site-header'
import { ajax } from 'discourse/lib/ajax'
import { withPluginApi } from 'discourse/lib/plugin-api'

export default {
  name: 'babble-shoutbox-init',
  initialize() {
    if (!Discourse.SiteSettings.babble_shoutbox) { return }

    SiteHeader.reopen({
      selector: '#main header.d-header',

      didInsertElement() {
        const component = this
        this._super()
        Ember.run.scheduleOnce('afterRender',() => {
          ajax('/babble/topics.json').then((data) => {
            let availableTopics = data.topics.map((data) => { return Babble.buildTopic(data) })
            if (!availableTopics.length) { console.log('No topics available!'); return }

            ajax('/babble/topics/default.json').then((data) => {
              component.set('babbleTopic', Babble.buildTopic(data))

              withPluginApi('0.1', api => {
                api.decorateWidget('header-icons:before', function(helper) {
                  let contents = []

                  if (!Babble.disabled() &&
                      api.getCurrentUser() &&
                      component.babbleTopic &&
                      Discourse.SiteSettings.babble_enabled) {

                    contents.push(helper.attach('header-dropdown', {
                      title:         'babble.title',
                      icon:          Discourse.SiteSettings.babble_icon,
                      iconId:        'babble-icon',
                      active:        component.babbleVisible,
                      action:        'toggleBabble',
                      contents() {
                        if (!component.babbleTopic.unreadCount || component.babbleVisible) { return }
                        return this.attach('link', {
                          action:    'toggleBabble',
                          className: 'badge-notification unread-notifications',
                          rawLabel:  component.babbleTopic.visibleUnreadCount
                        })
                      }
                    }));
                  }
                  if (component.babbleVisible) {
                    if (component.babbleViewingChat === undefined) {
                      component.babbleViewingChat = true
                    }
                    contents.push(helper.attach('babble-menu', {
                      availableTopics:       availableTopics,
                      topic:                 component.babbleTopic,
                      viewingChat:           component.babbleViewingChat
                    }))
                  }
                  return contents
                })

                api.attachWidgetAction('header', 'toggleBabble', function() {
                  Babble.editPost(component.babbleTopic, null)
                  component.babbleVisible = !component.babbleVisible

                  if (component.babbleVisible) {
                    Babble.bind(component)
                  } else {
                    Babble.unbind(component)
                  }
                })

                api.attachWidgetAction('header', 'toggleBabbleViewingChat', function(topic) {
                  if (topic) { component.set('babbleTopic', topic) }
                  component.babbleViewingChat != component.babbleViewingChat
                })

                component.queueRerender()
              }, console.log)
            }, console.log)
          })
        })
      }
    })
  }
}
