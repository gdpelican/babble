import Post from "discourse/models/post"
import Topic from "discourse/models/topic"
import showModal from "discourse/lib/show-modal"

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
    return !this.get('post.deleted_at') &&
           (this.get('post.can_edit') ||
            this.get('post.can_delete') ||
            this.get('post.flagsAvailable.length'))
  }.property('post.can_edit', 'post.can_delete', 'post.deleted_at', 'post.flagsAvailable.length'),

  dropdownActions: function() {
    const self = this
    return {
      edit: function() {
        self.set('isEditing', true)
      },

      flag: function() {
        showModal('flag', self.get('post'))
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
