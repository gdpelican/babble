import { withPluginApi } from 'discourse/lib/plugin-api';
import Babble from "../lib/babble";
import SiteHeader from 'discourse/components/site-header';
import autosize from 'discourse/lib/autosize';
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
      @observes('Discourse.Babble.currentTopicId', 'Discourse.Babble.postStreamUpdated')
      _babbleRenderPosts() {
        const topic = Discourse.Babble.currentTopic
        if (topic) {this.container.lookup('topic-tracking-state:main').updateSeen(topic.id, topic.highest_post_number)}
        this.queueRerender()
        Ember.run.scheduleOnce('afterRender', () => {
          this.$('.babble-list').scrollTop($('.babble-posts').height())
        })
      },

      @observes('Discourse.Babble.queueRerender')
      _rerenderTrigger() {
        this.queueRerender()
      },

      @observes('Discourse.Babble.postStreamUpdated', 'Discourse.Babble.editingPostId')
      afterPatch() {
        Ember.run.scheduleOnce('afterRender', () => {
          const $textarea = this.$('.babble-post-composer textarea')
          if ($textarea.length) {
            if (!$textarea.val()) {
              const editingId = Discourse.Babble.editingPostId
              if (editingId) {
                var post = Discourse.Babble.currentTopic.postStream.findLoadedPost(editingId)
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

        var currentUser = api.getCurrentUser(),
            headerState = helper.widget.parentWidget.state,
            enabled = Discourse.SiteSettings.babble_enabled,
            topicId = Discourse.Babble.currentTopicId;

        var contents = [];
        if (!helper.widget.site.mobileView && currentUser && enabled && topicId) {
          const unread = Discourse.Babble.unreadCount,
                icon = Discourse.SiteSettings.babble_icon;
          contents.push(helper.attach('header-dropdown', {
            title: 'babble.title',
            icon: icon,
            iconId: 'babble-icon',
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
          if (headerState.babbleViewingChat === undefined) {
            headerState.babbleViewingChat = true
            Discourse.Babble.toggleProperty('postStreamUpdated')
          }
          contents.push(helper.attach('babble-menu', {viewingChat: headerState.babbleViewingChat}))
        }
        return contents
      })

      api.attachWidgetAction('header', 'toggleBabble', function() {
        this.state.babbleVisible = !this.state.babbleVisible
      })

      api.attachWidgetAction('header', 'toggleBabbleViewingChat', function() {
        this.state.babbleViewingChat = !this.state.babbleViewingChat
      })

    })
  }
}
