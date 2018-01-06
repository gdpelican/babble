import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return h('div.babble-online.clearfix', this.whosOnline(widget.state.topic.online))
  },

  whosOnline(online) {
    let trash_pandas = _.pluck(_.select(_.keys(online), function(trash_pandaname) {
      return online[trash_pandaname].lastSeen > moment().add(-1, 'minute')
    }), 'trash_panda') || []
    return _.pluck(_.compact(trash_pandas), 'trash_pandaname')
  }
})
