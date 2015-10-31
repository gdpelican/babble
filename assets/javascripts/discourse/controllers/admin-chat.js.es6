export default Ember.Controller.extend({
  needs: ['adminChats'],

  actions: {

    groupAdded(group) {
      var groupIds = this.get('model.allowed_group_ids') || []
      this.set('model.allowed_group_ids', groupIds.concat(group.id))
    },

    groupRemoved(groupId) {
      var groupIds = this.get('model.allowed_group_ids') || []
      this.set('model.allowed_group_ids', groupIds.removeObject(groupId))
    },

    save() {
      const topic = this.get('model')
      const allTopics = this.get('controllers.adminChats.model')
      const self = this

      self.set('disableSave', true);

      var route = '/babble/topics/'
      if (topic.id) { route += topic.id }

      Discourse.ajax(route, {
        type: "POST",
        data: {
          topic: {
            title: topic.get('title'),
            allowed_group_ids: topic.get('allowed_group_ids')
          }
        }
      }).then(function(saved) {
        saved = Discourse.Topic.create(saved)
        if (topic.id) {
          var topicIndex = _.pluck(allTopics, 'id').indexOf(topic.id)
          Ember.set(allTopics.objectAt(topicIndex), 'title', saved.title)
        } else {
          allTopics.addObject(saved)
        }
        Discourse.Babble.setAvailableTopics()
        self.transitionToRoute('adminChat', saved.id)

      }).catch(function() {
        bootbox.alert(I18n.t("babble.admin.save_failed"))
      }).finally(function() {
        self.set('disableSave', false)
      })
    },

    destroy() {
      const topic = this.get('model')
      const allTopics = this.get('controllers.adminChats.model')
      const self = this
      const confirm = bootbox

      self.set('disableSave', true);

      confirm.confirm(
        I18n.t("babble.admin.delete_confirm"),
        I18n.t("no_value"),
        I18n.t("yes_value"),
        function(confirmed) {
          if (confirmed) {
            Discourse.ajax('/babble/topics/' + topic.id + '.json', { type: "DELETE" }).then(function() {
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
