import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return h('div.babble-typing.clearfix', this.typingSentence(widget.state.topic.typing))
  },

  typingSentence(typing) {
    let usernames = _.select(_.keys(typing), function(username) {
      return typing[username].lastTyped > moment().add(-1, 'second')
    })

    if (!usernames.length) { return }
    setTimeout(() => { this.widget.scheduleRerender() }, 2000)
    switch(usernames.length) {
      case 1: return `${usernames[0]} is typing...`
      case 2: return `${usernames[0]} and ${usernames[1]} are typing...`
      case 3: return `several people are typing...`
    }
  }
})
