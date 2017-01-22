import Babble from "../../discourse/lib/babble"
import { ajax } from 'discourse/lib/ajax'

export default Discourse.Route.extend({
  setupController: function(controller) {
    ajax('/babble/topics.json').then((response) => {
      let availableTopics = response.topics.map((data) => { return Babble.buildTopic(data) })
      controller.setProperties({ model: availableTopics, disabled: Babble.disabled() })
    })
  }
});
