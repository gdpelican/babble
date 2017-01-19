import { queryRegistry } from 'discourse/widgets/widget'
import { withPluginApi } from 'discourse/lib/plugin-api'

export default {
  name: 'babble-common-init',
  initialize() {
    // sorry mom
    withPluginApi('0.1', api => {
      let _super = queryRegistry('notification-item').prototype.url
      api.reopenWidget('notification-item', {
        url() {
          if (!this.attrs.data.chat) { return _super.apply(this) }
          return `/chat/${this.attrs.slug}/${this.attrs.topic_id}/${this.attrs.post_number}`
        }
      })
    })
  }
}
