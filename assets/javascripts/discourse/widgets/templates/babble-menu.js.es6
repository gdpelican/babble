import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return this.widget.attach('menu-panel', { contents: () => { return this.panel() } })
  },

  panel() {
    let panel = this.widget.state.viewingChat ? 'babble-chat' : 'babble-channels'
    return h('section.babble-chat', this.widget.attach(panel, this.widget.attrs))
  }

})
