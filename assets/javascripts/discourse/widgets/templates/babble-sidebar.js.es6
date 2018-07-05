import { h } from 'virtual-dom'
import { visibleInWindow } from '../../lib/chat-element-utils'
import Babble from '../../lib/babble'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    if (!widget.attrs.canInitialize) { return }
    return widget.attrs.visible ? this.expanded() : this.collapsed()
  },

  expanded() {
    this.widget.attrs.expanded = this.widget.state.expanded

    const position = `.babble-sidebar--${Discourse.SiteSettings.babble_position}`
    let   opts     = {}
    const headerMargin = parseInt($('.babble-sidebar').css('margin-top'))

    if (Discourse.SiteSettings.babble_adaptive_height) {
      opts.style = `height: ${visibleInWindow('#main') - headerMargin}px;`
    }

    return h(`div.babble-sidebar${position}${this.css()}`, opts, [this.channels(), this.chat()])
  },

  collapsed() {
    return h(`div.btn.babble-sidebar-collapsed.babble-sidebar-collapsed--${Discourse.SiteSettings.babble_position}${this.css()}`, [
      this.collapsedIcon(),
      this.collapsedUnread()
    ])
  },

  channels() {
    if (this.widget.state.view != 'channels') { return null }
    return this.widget.attach('babble-channels', this.widget.attrs)
  },

  chat() {
    if (this.widget.state.view != 'chat') { return null }
    return this.widget.attach('babble-chat', this.widget.attrs)
  },

  collapsedIcon() {
    if (Babble.loadingTopics) {
      return h('div.spinner-container', h('div.spinner'))
    } else {
      return this.widget.attach('button', {
        icon: Discourse.SiteSettings.babble_icon,
        action: 'openChat'
      })
    }
  },

  collapsedUnread() {
    return h('div.babble-unread.babble-unread--sidebar', Babble.unreadCount())
  },

  css() {
    let css = ''
    if (this.widget.state.expanded || this.widget.attrs.mobile) {
      css += '.expanded'
    }
    if (this.widget.attrs.mobile) {
      css += '.mobile'
    }
    return css
  }
})
