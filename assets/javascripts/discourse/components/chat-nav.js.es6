import Babble from '../lib/babble'

export default Ember.Component.extend({
  tagName: 'a',
  classNameBindings: ['active'],

  icon: function() {
    return Discourse.SiteSettings.babble_icon
  }.property(),

  hasUnread: function() {
    return this.get('unread') > 0
  }.property(),

  unread: function() {
    return Babble.get('unreadCount')
  }.property(),

  click() {
    this.sendAction("action", this.get("actionParam"));
    return false;
  }
});
