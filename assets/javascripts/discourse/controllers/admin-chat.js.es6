import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'
import { observes } from 'ember-addons/ember-computed-decorators'

export default Ember.Controller.extend({
  adminChats: Ember.inject.controller(),
  groups: [],

  categoryPermissions: function() {
    return this.get('model.permissions') == 'category'
  }.property('model.permissions'),

  @observes('model.allowed_group_ids', 'model.id')
  _updateSelected: function() {
    this.set('groups', this.available.filter((g) => {
      return this.model.allowed_group_ids.includes(g.id)
    }))
  },

  actions: {
    groupAdded(added) {
      this.get("groups").pushObject(added)
    },

    groupRemoved(groupId) {
      this.set("groups.[]", this.get("groups").rejectBy("id", groupId))
    },

    save() {
      const topic = this.get('model')
      const allTopics = this.get('adminChats.model')
      const self = this
      const category = this.get('categories')[0]

      self.set('disableSave', true);

      var route = '/babble/topics/'
      if (topic.id) { route += topic.id }

      let topicAttrs = {
        title: topic.get('title'),
        allowed_group_ids: this.get('groups').map((g) => { return g.id }),
        permissions: topic.get('permissions')
      }

      if (category) {
        topicAttrs['category_id'] = category.id
      }

      ajax(route, {
        type: "POST",
        data: {
          topic: topicAttrs
        }
      }).then(function(saved) {
        saved = Discourse.Topic.create(saved)
        if (topic.id) {
          var topicIndex = _.pluck(allTopics, 'id').indexOf(topic.id)
          Ember.set(allTopics.objectAt(topicIndex), 'title', saved.title)
        } else {
          allTopics.addObject(saved)
        }
        self.transitionToRoute('adminChat', saved.id)

      }).catch(function() {
        bootbox.alert(I18n.t("babble.admin.save_failed"))
      }).finally(function() {
        self.set('disableSave', false)
      })
    },

    destroy() {
      const topic = this.get('model')
      const allTopics = this.get('adminChats.model')
      const self = this
      const confirm = bootbox

      self.set('disableSave', true);

      confirm.confirm(
        I18n.t("babble.admin.delete_confirm"),
        I18n.t("no_value"),
        I18n.t("yes_value"),
        function(confirmed) {
          if (confirmed) {
            ajax(`/babble/topics/${topic.id}.json`, { type: "DELETE" }).then(function() {
              var deleted = _.find(allTopics, function(t) { return t.id === topic.id })
              allTopics.removeObject(deleted)
              self.transitionToRoute('adminChats.index')
            }).catch(function() {
              confirm.alert(I18n.t("babble.admin.delete_failed"))
            }).finally(function() {
              self.set('disableSave', false)
            })
          } else {
            self.set('disableSave', false);
          }
        }
      );
    }
  }
});
