import Babble from "../../discourse/lib/babble"
import { ajax } from "discourse/lib/ajax"

export default Discourse.Route.extend({
  setupController: function(controller) {
    ajax(`/babble/topics.json`).then(function() {
      controller.setProperties({ model: Babble.get('availableTopics'), disabled: Babble.disabled() })
    })
  }
});
