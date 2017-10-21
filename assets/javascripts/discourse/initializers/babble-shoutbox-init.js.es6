import Babble from '../lib/babble'
import SiteHeader from 'discourse/components/site-header'
import { ajax } from 'discourse/lib/ajax'
import { withPluginApi } from 'discourse/lib/plugin-api'
import { queryRegistry } from 'discourse/widgets/widget'

export default {
  name: 'babble-shoutbox-init',
  initialize() {
    if (Babble.disabled() || !Discourse.SiteSettings.babble_shoutbox) { return }

  }
}
