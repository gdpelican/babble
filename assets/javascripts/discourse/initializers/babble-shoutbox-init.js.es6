import Babble from '../lib/babble'
import SiteHeader from 'discourse/components/site-header'
import { ajax } from 'discourse/lib/ajax'
import { withPluginApi } from 'discourse/lib/plugin-api'

export default {
  name: 'babble-shoutbox-init',
  initialize() {
    if (!Discourse.SiteSettings.babble_shoutbox) { return }

    SiteHeader.reopen({

      didInsertElement() {
        const component = this
        this._super()
        Ember.run.scheduleOnce('afterRender',() => {
          ajax('/babble/topics.json').then((data) => {
            let availableTopics = data.topics.map((data) => { return Babble.buildTopic(data) })
            if (!availableTopics.length) { console.log('No topics available!'); return }

            ajax('/babble/topics/default.json').then((data) => {
              Babble.bind(this, Babble.buildTopic(data))

              withPluginApi('0.1', api => {
                api.decorateWidget('header-icons:before', function(helper) {
                  const topic = Babble.topicForComponent(component)
                  let contents = []

                  if (!Babble.disabled() &&
                      api.getCurrentUser() &&
                      Discourse.SiteSettings.babble_enabled) {

                    contents.push(helper.attach('header-dropdown', {
                      title:         'babble.title',
                      icon:          Discourse.SiteSettings.babble_icon,
                      iconId:        'babble-icon',
                      active:        component.babbleVisible,
                      action:        'toggleBabble',
                      contents() {
                        if (!topic.visibleUnreadCount || component.babbleVisible) { return }
                        return this.attach('link', {
                          action:    'toggleBabble',
                          className: 'badge-notification unread-notifications',
                          rawLabel:  topic.visibleUnreadCount
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
                      topic:                 topic,
                      viewingChat:           component.babbleViewingChat
                    }))
                  }
                  return contents
                })

                api.attachWidgetAction('header', 'toggleBabble', function() {
                  const topic = Babble.topicForComponent(component)
                  component.babbleVisible = !component.babbleVisible
                  Babble.bind(component, topic)

                  if (!component.babbleVisible) { Babble.editPost(topic, null) }
                })

                api.attachWidgetAction('header', 'toggleBabbleViewingChat', function(topic) {
                  component.babbleViewingChat = !component.babbleViewingChat
                  Babble.bind(component, topic)
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
