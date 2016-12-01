import Babble from "../../discourse/lib/babble"
import { ajax } from 'discourse/lib/ajax'

export default Discourse.Route.extend({
  renderTemplate: function() { this.render('discovery') }
});
