import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return this.widget.attach('menu-panel', { contents: () => {
      return this.widget.attach(this.visiblePanel(), this.widget.attrs)
    }})
  },

  visiblePanel() {
    return this.widget.state.viewingChat ? 'babble-chat' : 'babble-channels'
  }

})
