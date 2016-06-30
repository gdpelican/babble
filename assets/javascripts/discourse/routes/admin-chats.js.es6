import Babble from "../../discourse/lib/babble"

export default Discourse.Route.extend({

  model: function() {
    Babble.get('availableTopics') // TODO
  },

  setupController: function(controller, model) {
    controller.setProperties({ model: model, disabled: Babble.disabled() })
  }
});
