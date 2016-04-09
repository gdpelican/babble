import Post from "discourse/models/post"
import Topic from "discourse/models/topic"

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['babble-post'],

  isStaged: Em.computed.equal('post.id', -1),
  userDeleted: Em.computed.empty('post.user_id'),

  _init: function() {
    this.set('isLastRead', this.get('post.post_number') <   this.get('highestPostNumber') &&
                           this.get('post.post_number') === this.get('lastReadPostNumber'))
  }.on('init'),

  highestPostNumber: function() {
    return Discourse.Babble.get('currentTopic.highest_post_number')
  }.property('Discourse.Babble.currentTopic.highest_post_number'),

  lastReadPostNumber: function() {
    return Discourse.Babble.get('currentTopic.last_read_post_number')
  }.property('Discourse.Babble.currentTopic.last_read_post_number'),

  canPerformActions: function() {
    return !this.get('post.deleted_at') &&
           (this.get('post.can_edit') ||
            this.get('post.can_delete'))
  }.property('post.can_edit', 'post.can_delete', 'post.deleted_at'),

  isEditing: function() {
    return Discourse.Babble.editingPostId == this.get('post.id')
  }.property('Discourse.Babble.editingPostId'),

  dropdownActions: function() {
    const self = this
    return {
      edit: function() {
        Discourse.Babble.set('editingPostId', self.get('post.id'))
      },

      delete: function() {
        self.set('isStaged', true)
        Discourse.ajax(`/babble/topics/${self.get('post.topic_id')}/destroy/${self.get('post.id')}`, {
          type: 'DELETE',
        }).then(Discourse.Babble.handleNewPost, () => {
          self.set('errorMessage', 'babble.failed_post')
        }).finally(() => {
          self.set('isStaged', false)
        })
      }
    }
  }.property('post'),

  actions: {
    toggleActions: function() {
      this.set('showActions', !this.get('showActions'))
    }
  }

});
