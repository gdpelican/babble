import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    if (!widget.attrs.visible) { return }

    let expanded = widget.state.expanded ? '.expanded' : ''
    let view     = widget.attrs.topic.id ? 'babble-chat' : 'babble-channels'
    return h(`div.babble-sidebar${expanded}`, widget.attach(view, widget.attrs))
  }
})
