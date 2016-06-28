import Babble from "../../discourse/lib/babble"

export default Discourse.Route.extend({

  model: function() {
    if (Babble.disabled()) { return }
    return Babble.setAvailableTopics().then(
      () => { return Babble.get('availableTopics') }
    )
  },

  setupController: function(controller, model) {
    controller.setProperties({ model: model, disabled: Babble.disabled() })
  }
});
