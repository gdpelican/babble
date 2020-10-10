import { h } from 'virtual-dom'
import { compact } from '../../lib/babble-utils';

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return h('div.babble-online.clearfix', this.whosOnline(widget.state.topic.online))
  },

  whosOnline(online) {
    return compact(
      Object.keys(online).filter((username) => {
        return online[username].lastSeen > moment().add(-1, 'minute');
      })
    );
  }
})
