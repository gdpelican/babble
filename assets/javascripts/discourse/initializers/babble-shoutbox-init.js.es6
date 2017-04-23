import Babble from '../lib/babble'
import SiteHeader from 'discourse/components/site-header'
import { ajax } from 'discourse/lib/ajax'
import { withPluginApi } from 'discourse/lib/plugin-api'
import { queryRegistry } from 'discourse/widgets/widget'

export default {
  name: 'babble-shoutbox-init',
  initialize() {
    if (Babble.disabled() || !Discourse.SiteSettings.babble_shoutbox) { return }

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
                api.addHeaderPanel('babble-menu', 'babbleVisible', function() {
                  return {
                    availableTopics: availableTopics,
                    topic:           Babble.topicForComponent(component)
                  }
                })

                api.attachWidgetAction('header', 'toggleBabble', function() {
                  const page = $('html, body')
                  const topic = Babble.topicForComponent(component)
                  topic.inShoutbox = this.state.babbleVisible = !topic.inShoutbox

                  Babble.bind(component, topic)

                  if (topic.inShoutbox) {
                    page.css('overflow', 'hidden')
                    Ember.run.scheduleOnce('afterRender', function() {
                      // hack to force redraw of the side panel, which occasionally draws incorrectly
                      page.find('.babble-menu').find('.menu-panel.slide-in').hide().show(0)
                    })
                  } else {
                    page.css('overflow', 'auto')
                    Babble.clearEditing(topic)
                  }
                })

                api.attachWidgetAction('header', 'changeTopic', function(topic) {
                  Babble.topicForComponent(component).inShoutbox = false
                  Babble.bind(component, topic)
                  topic.inShoutbox = true
                })

                api.decorateWidget('header-icons:before', function(helper) {
                  const topic = Babble.topicForComponent(component)

                  return helper.attach('header-dropdown', {
                    title:         'babble.title',
                    icon:          Discourse.SiteSettings.babble_icon,
                    iconId:        'babble-icon',
                    active:        topic.inShoutbox,
                    action:        'toggleBabble',
                    contents() {
                      if (!topic.visibleUnreadCount || topic.inShoutbox) { return }
                      return this.attach('link', {
                        action:    'toggleBabble',
                        className: 'badge-notification unread-notifications',
                        rawLabel:  topic.visibleUnreadCount
                      })
                    }
                  })
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
