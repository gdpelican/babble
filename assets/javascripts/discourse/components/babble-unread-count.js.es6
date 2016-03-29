const MAX_POST_WINDOW_SIZE = 20

export default Ember.Component.extend({
  tagName: 'a',
  classNames: ['badge-notification', 'unread-notifications'],

  isVisible: function() {
    return this.get('unreadCount') > 0
  }.property('topic'),

  unreadCount: function() {
    return this.get('topic.highest_post_number') - (this.get('topic.last_read_post_number') || 0)
  }.property('topic'),

  unreadCountString: function() {
    let unreadCount = this.get('unreadCount')
    return unreadCount > MAX_POST_WINDOW_SIZE ? `${MAX_POST_WINDOW_SIZE}+` : unreadCount.toString()
  }.property('topic')

});
