import { withPluginApi } from 'discourse/lib/plugin-api';
import Babble from 'discourse/plugins/babble/discourse/lib/babble'

export default {
  name: 'babble',
  initialize(){

    Discourse.ajax('/babble/topics/default.json').then(
      (data)  => { Babble.setCurrentTopic(data) },
      (error) => {
        if (error.status === 404) { console.log('No chat channels are available.') }
        else                      { throw error }
      }
    )

    withPluginApi('0.1', api => {
      api.decorateWidget('header-icons:before', function(helper) {
        if (!api.getCurrentUser() || Babble.disabled()) { return; }
        // Discourse.Babble.setAvailableTopics()

        let contents      = []
        const active = helper.widget.parentWidget.state.babbleVisible
        contents.push(helper.attach('header-dropdown', {
          title: 'babble.title',
          icon: Discourse.SiteSettings.babble_icon,
          iconId: 'babble-icon',
          active: active,
          action: 'toggleBabble'
        }))

        if (active) { contents.push(helper.attach('babble-menu')) }
        return contents
      })

      api.attachWidgetAction('header', 'toggleBabble', function() {
        this.state.babbleVisible = !this.state.babbleVisible
      })
    })
  }
}
