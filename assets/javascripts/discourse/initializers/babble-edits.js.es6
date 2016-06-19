import { withPluginApi } from 'discourse/lib/plugin-api';
import Babble from "../lib/babble";
import SiteHeader from 'discourse/components/site-header';
import { default as computed, on, observes } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'babble-edits',
  initialize(){

    if (!Discourse.Babble) { Discourse.Babble = Babble }
    if (Discourse.Babble.disabled()) { return }
    Discourse.ajax('/babble/topics/default.json').then(Discourse.Babble.setCurrentTopic, function(e) {
      if (e.status === 404) {
        console.log('No chat channels are available.')
      } else {
        console.log(e)
      }
    })
    Discourse.Babble.setAvailableTopics()

    SiteHeader.reopen({
      @observes('Discourse.Babble.currentTopicId')
      _babbleChanged() {
        this.queueRerender();
      }
    })

    withPluginApi('0.1', api => {
      api.decorateWidget('header-icons:before', function(helper) {

        var currentUser = api.getCurrentUser(),
            headerState = helper.widget.parentWidget.state,
            enabled = Discourse.SiteSettings.babble_enabled,
            topicId = Discourse.Babble.currentTopicId

        var contents = [];
        if (!helper.widget.site.mobileView && currentUser && enabled && topicId) {
          const unread = Discourse.Babble.unreadCount,
                icon = Discourse.SiteSettings.babble_icon;
          contents.push(helper.attach('header-dropdown', {
            title: 'babble.title',
            icon: icon,
            iconId: 'babble-notifications',
            active: headerState.babbleVisible,
            action: 'toggleBabble',
            contents() {
              if (unread) {
                return this.attach('link', {
                  action: 'toggleBabble',
                  className: 'badge-notification unread-notifications',
                  rawLabel: unread
                });
              }
            }
          }));
        }
        if (headerState.babbleVisible) {
          contents.push(helper.attach('babble-menu'))
        }
        return contents
      })

      api.attachWidgetAction('header', 'toggleBabble', function() {
        this.state.babbleVisible = !this.state.babbleVisible
      })

    })
  }
}
