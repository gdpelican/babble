import initializeBabble from "../../discourse/lib/babble"


export default Discourse.Route.extend({

  model: function(params) {
    if (params.id === 'new') {
      return Discourse.Topic.create()
    } else {
      if (!Discourse.Babble) { Discourse.Babble = initializeBabble }
      return Discourse.ajax('/babble/topics/' + params.id + '.json').then(function(data) { return Discourse.Topic.create(data) })
    }
  },

  setupController: function(controller, model) {
    const self = this

    var setup = function(selected, available) {
      if (selected) { self._selected = selected }
      if (available) { self._available = available }
      if (!self._available || !self._selected) { return }

      self._available = _.map(self._available, function(g) { g.automatic = false; return g })
      self._selected  = _.map(self._selected,  function(g) { g.automatic = false; return g })

      model.allowed_group_ids = _.pluck(self._selected, 'id')
      controller.setProperties({ model: model, available: self._available, selected: self._selected })
    }

    if (model.id) {
      Discourse.ajax('/babble/topics/' + model.id + '/groups.json').then(function(data) { setup(data.topics, null) })
    } else {
      setup([], null)
    }

    Discourse.Group.findAll().then(function(groups) {
      setup(null, groups)
    })
  }
});
