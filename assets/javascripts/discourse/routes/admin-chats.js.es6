import initializeBabble from "../../discourse/lib/babble"

export default Discourse.Route.extend({

  model: function() {
    if (!Discourse.Babble) { Discourse.Babble = initializeBabble }
    return Discourse.Babble.setAvailableTopics().then(function() { return Discourse.Babble.get('availableTopics') })
  },

  setupController: function(controller, model) {
    controller.setProperties({ model: model })
  }
});
