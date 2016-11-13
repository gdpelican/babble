import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return this.presenceSentence(widget.state.topic.presence)
  },

  presenceSentence(presence) {
    const usernames = _.keys(_.select(presence, (lastSeen) => {
      return lastSeen > moment().add(-2, 'second')
    }))
    if (usernames.length) {
      setTimeout(() => { this.widget.scheduleRerender() }, 2000)
      return this.widget.attach('small-user-list', {
        users: usernames,
        listClassName: 'babble-is-typing',
        description: 'babble.is_typing'
      })
    } else {
      return h('div.babble-no-one-is-typing')
    }
  },
})
