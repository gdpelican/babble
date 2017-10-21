import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    if (widget.attrs.topic.id) {
      return widget.attach('babble-chat', widget.attrs)
    } else {
      return widget.attach('babble-channels', widget.attrs)
    }
  }
})
