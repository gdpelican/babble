import { h } from 'virtual-dom'
import { visibleInWindow } from '../../lib/chat-element-utils'

export default Ember.Object.create({
  render(widget) {
    if (!widget.attrs.visible) { return }
    widget.attrs.expanded = widget.state.expanded
    this.widget = widget
    let helperCss = ''

    if (widget.state.expanded || widget.attrs.mobile) {
      helperCss += '.expanded'
    }
    if (widget.attrs.mobile) {
      helperCss += '.mobile'
    }

    const position = `.babble-sidebar--${Discourse.SiteSettings.babble_position}`
    let   opts     = {}
    const headerMargin = parseInt($('.babble-sidebar').css('margin-top'))

    if (Discourse.SiteSettings.babble_adaptive_height) {
      opts.style = `height: ${visibleInWindow('#main') - headerMargin}px;`
    }

    return h(`div.babble-sidebar${position}${helperCss}`, opts, [this.channels(), this.chat()])
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
