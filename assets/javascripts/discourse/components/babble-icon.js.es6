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

  @observes('currentTopicId')
  babbleEnabled: function() {
    return Discourse.SiteSettings.babble_enabled && this.get('currentTopicId')
  },

  unreadCount: function() {
    if (Discourse.Babble.unreadCount > 0) {
      return Discourse.Babble.unreadCount
    } else {
      return null
    }
  }.property('Discourse.Babble.unreadCount'),

  _init: function() {
    if (!Discourse.Babble) { Discourse.Babble = initializeBabble }

    this.set('babbleIcon', Discourse.SiteSettings.babble_icon)
    Discourse.ajax('/babble/topics/default.json').then(Discourse.Babble.setCurrentTopic)
    Discourse.ajax('/babble/topics.json').then(Discourse.Babble.setAvailableTopics)
  }.on('init')
});
