import Babble from "../../discourse/lib/babble"
import { ajax } from 'discourse/lib/ajax'

export default Discourse.Route.extend({
  setupController: function(controller) {
    ajax('/babble/topics.json').then((response) => {
      Babble.setAvailableTopics(response)
      controller.setProperties({ model: Babble.getAvailableTopics(), disabled: Babble.disabled() })
    })
  }
});
