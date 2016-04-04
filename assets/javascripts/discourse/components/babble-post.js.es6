import Post from "discourse/models/post"
import Topic from "discourse/models/topic"

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['babble-post'],

  isStaged: Em.computed.equal('post.id', -1),
  userDeleted: Em.computed.empty('post.user_id'),

  _init: function() {
    this.set('isLastRead', this.get('post.post_number') <   this.get('post.topic.highest_post_number') &&
                           this.get('post.post_number') === this.get('post.topic.last_read_post_number'))
  }.on('init'),

  canPerformActions: function() {
    return this.get('post.can_edit') || this.get('post.can_delete') || this.get('post.flagsAvailable.length')
  }.property('post'),

  dropdownActions: function() {
    const self = this
    return {
      edit: function() {
        self.set('isEditing', true)
      },

      flag: function() {
        self.set('isFlagging', true)
        console.log('flag')
      },

      delete: function() {
        self.set('isDeleting', true)
        console.log('delete')
      }
    }
  }.property('post'),

  actions: {
    toggleActions: function() {
      this.set('showActions', !this.get('showActions'))
    }
  }

});
