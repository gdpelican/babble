import initializeBabble from "../../discourse/lib/babble"
import Topic from 'discourse/models/topic'
import Group from 'discourse/models/group'

export default Discourse.Route.extend({

  model: function(params) {
    if (params.id === 'new') {
      return Topic.create()
    } else {
      if (!Discourse.Babble) { Discourse.Babble = initializeBabble }
      return Discourse.ajax('/babble/topics/' + params.id + '.json').then(function(data) { return Topic.create(data) })
    }
  },

  setupController: function(controller, model) {
    const self = this

    var setup = function(selected, available) {
      const everyoneGroupId = 0;

      if (selected) { self._selected = selected }
      if (available) { self._available = available }
      if (!self._available || !self._selected) { return }

      self._available = _.map(self._available, function(g) { g.automatic = false; return g })
      self._selected  = _.map(self._selected,  function(g) { g.automatic = false; return g })
      self._available = _.reject(self._available, function(g) { return g.id == everyoneGroupId; })

      model.allowed_group_ids = _.pluck(self._selected, 'id')
      controller.setProperties({ model: model, available: self._available, selected: self._selected })
    }

    if (model.id) {
      Discourse.ajax('/babble/topics/' + model.id + '/groups.json').then(function(data) { setup(data.topics, null) })
    } else {
      setup([], null)
    }

    Group.findAll().then(function(groups) {
      setup(null, groups)
    })
  }
});
