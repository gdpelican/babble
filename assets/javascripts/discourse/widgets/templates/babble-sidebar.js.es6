import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    if (!widget.attrs.visible) { return }
    this.widget = widget

    let expanded = widget.state.expanded ? '.expanded' : ''
    return h(`div.babble-sidebar${expanded}`, [this.channels(), this.chat()])
  },

  channels() {
    if (this.widget.state.view != 'channels') { return null }
    return this.widget.attach('babble-channels', this.widget.attrs)
  },

  chat() {
    if (this.widget.state.view != 'chat') { return null }
    return this.widget.attach('babble-chat', this.widget.attrs)
  }
})
