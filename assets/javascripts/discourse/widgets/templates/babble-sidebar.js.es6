import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'
import { onlineSentence } from '../../lib/chat-topic-utils'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    const displayedUsersCount = 3
    const online = widget.attrs.topic.online
    if (!Discourse.SiteSettings.babble_whos_online) { return }
    let klass = 'div.babble-sidebar'
    if (widget.state.toggled) { klass += '.toggled' }

    return h(klass, [
      h('h4.babble-sidebar-title', onlineSentence(widget.attrs.topic)),
      _.map(widget.attrs.topic.online, this.lineItem),
      this.toggle('babble-sidebar-toggle-on', 'users', true),
      this.toggle('babble-sidebar-toggle-off', 'times', false)
    ])
  },

  toggle(klass, icon, showWhenToggled) {
    if (!!this.widget.state.toggled == showWhenToggled) { return }
    return this.widget.attach('button', {
      className: 'btn babble-sidebar-toggle ' + klass,
      icon: icon,
      action: 'toggle'
    })
  },

  lineItem(user) {
    return h('div.babble-sidebar-line-item', { attributes: { 'data-user-card': user.username } }, [
      avatarImg('small', { template: user.avatar_template, username: user.username }),
      h('div.babble-siderbar-name', user.username)
    ])
  }
})
