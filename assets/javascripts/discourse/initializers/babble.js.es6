import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
  name: 'babble',
  initialize(){

    withPluginApi('0.1', api => {
      api.decorateWidget('header-icons:before', function(helper) {
        let contents      = []
        const headerState = helper.widget.parentWidget.state
        if (!api.getCurrentUser()) { return; }

        contents.push(helper.attach('header-dropdown', {
          title: 'babble.title',
          icon: 'bullhorn',
          iconId: 'babble-icon',
          active: headerState.babbleVisible,
          action: 'toggleBabble'
        }))

        if (headerState.babbleVisible) { contents.push(helper.attach('babble-menu')) }
        return contents
      })

      api.attachWidgetAction('header', 'toggleBabble', function() {
        this.state.babbleVisible = !this.state.babbleVisible
      })
    })
  }
}
