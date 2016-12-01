import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return this.notificationsList(widget.state.notifications)
  },

  notificationsList(notifications) {
    return h('div', [
      h('input', {type: 'text', value: this.widget.state.link}),
      h('.share-for-touch', h('.overflow-ellipsis')),
    ])
  },
})
