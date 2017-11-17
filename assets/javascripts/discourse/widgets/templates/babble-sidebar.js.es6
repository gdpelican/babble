import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    if (!widget.attrs.visible) { return }
    this.widget = widget

    const expanded = widget.state.expanded ? '.expanded' : ''
    const position = `.babble-sidebar--${Discourse.SiteSettings.babble_position}`
    let   opts     = {}

    if (Discourse.SiteSettings.babble_adaptive_height) {
      const height = $('.d-header').height()
      opts.style   = `margin-top: ${height}px; height: calc(100% - ${height}px);`
    }

    return h(`div.babble-sidebar${position}${expanded}`, opts, [this.channels(), this.chat()])
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
