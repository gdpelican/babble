import { observes } from 'ember-addons/ember-computed-decorators';
import initializeBabble from "../lib/babble"

export default Ember.Component.extend({

  classNames: ['babble-icon'],
  tagName: 'li',

  currentTopicId: function() {
    return Discourse.Babble.currentTopicId
  }.property('Discourse.Babble.currentTopicId'),

  currentTopic: function() {
    return Discourse.Babble.currentTopic
  }.property('Discourse.Babble.currentTopic'),

  babbleEnabled: function() {
    return Discourse.SiteSettings.babble_enabled && this.get('currentTopicId')
  }.property('Discourse.Babble.currentTopicId'),

  unreadCount: function() {
    if (Discourse.Babble.unreadCount > 0 && Discourse.Babble.hasAdditionalUnread) {
      return Discourse.Babble.unreadCount + "+"
    } else if (Discourse.Babble.unreadCount) {
      return Discourse.Babble.unreadCount
    } else {
      return null
    }
  }.property('Discourse.Babble.unreadCount', 'Discourse.Babble.hasAdditionalUnread'),

  _init: function() {
    if (!Discourse.Babble) { Discourse.Babble = initializeBabble }

    var handleNotFound = function(error) {
      if (error.jqXHR.status === 404) {
        console.log('No chat channels are available.')
      } else {
        throw error
      }
    }

    this.set('babbleIcon', Discourse.SiteSettings.babble_icon)
    Discourse.ajax('/babble/topics/default.json').then(Discourse.Babble.setCurrentTopic).catch(handleNotFound)
    Discourse.Babble.setAvailableTopics()
  }.on('init')
});
