import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return h('div.clearfix', this.presenceSentence(widget.state.topic.presence))
  },

  presenceSentence(presence) {
    let usernames = _.select(_.keys(presence), function(username) {
      return presence[username] > moment().add(-2, 'second')
    })
    if (!usernames.length) { return }
    setTimeout(() => { this.widget.scheduleRerender() }, 2000)
    switch(usernames.length) {
      case 1: return `${usernames[0]} person is typing...`
      case 2: return `${usernames[0]} and ${usernames[1]} are typing...`
      case 3: return `several people are typing`
    }
  }
})
