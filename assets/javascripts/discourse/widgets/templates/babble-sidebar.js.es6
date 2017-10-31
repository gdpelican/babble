import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    if (!widget.attrs.visible) { return }

    let view = widget.attrs.topic.id ? 'babble-chat' : 'babble-channels'
    return h('div.babble-sidebar', widget.attach(view, widget.attrs))
  }
})
