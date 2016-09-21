import Babble from "../../discourse/lib/babble"

export default Discourse.Route.extend({

  setupController: function(controller, model) {
    controller.setProperties({
      topic:           Babble.get('currentTopic'),
      availableTopics: Babble.getAvailableTopics(true)
    })
  }
});
