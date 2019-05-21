import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return h('div.babble-online.clearfix', this.whosOnline(widget.state.topic.online))
  },

  whosOnline(online) {
    let users = _.compact(_.map(_.filter(_.keys(online), function(username) {
      return online[username].lastSeen > moment().add(-1, 'minute')
    }), 'user'))
    return _.map(users, 'username')
  }
})
