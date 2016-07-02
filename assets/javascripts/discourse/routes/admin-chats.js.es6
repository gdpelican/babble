import Babble from "../../discourse/lib/babble"

export default Discourse.Route.extend({

  model: function() {
    return Babble.get('availableTopics')
  },

  setupController: function(controller, model) {
    controller.setProperties({ model: model, disabled: Babble.disabled() })
  }
});
