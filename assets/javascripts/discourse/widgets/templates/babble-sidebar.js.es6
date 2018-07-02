import { h } from 'virtual-dom'
import { visibleInWindow } from '../../lib/chat-element-utils'
import Babble from '../../lib/babble'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
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
    if (this.unreadCount() + this.notificationCount() > 0) {
      return h('div.babble-unread.babble-unread--sidebar', (this.notificationCount() || '•').toString())
    }
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
  },

  notificationCount() {
    if (this.widget.attrs.initialized) {
      return Babble.availableNotifications().length
    } else {
      return this.widget.attrs.summary.notificationCount
    }
  },

  unreadCount() {
    if (this.widget.attrs.initialized) {
      return Babble.availableTopics().reduce((total, topic) => { return total + topic.unreadCount }, 0)
    } else {
      return this.widget.attrs.summary.unreadCount
    }
  }
})
