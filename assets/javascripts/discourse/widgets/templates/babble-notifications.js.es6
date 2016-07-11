import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return this.notificationsList(widget.state.notifications)
  },

  notificationsList(notifications) {
    const currentUserName = Discourse.User.currentProp('username')
    const users = Object.keys(notifications).filter(username => currentUserName !== username)
    if (users.length) {
      return this.widget.attach('small-user-list', {
        users: users.map(user => notifications[user].user),
        listClassName: 'babble-is-typing',
        description: 'babble.is_typing'
      })
    } else {
      return h('div.babble-no-one-is-typing')
    }
  },
})
