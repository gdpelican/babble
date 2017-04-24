import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'
import { onlineSentence } from '../../lib/chat-topic-utils'

export default Ember.Object.create({
  render(widget) {
    const displayedUsersCount = 3
    const online = widget.attrs.topic.online
    if (!Discourse.SiteSettings.babble_whos_online) { return }

    return h('div.babble-sidebar', [
      h('h4.babble-sidebar-title', onlineSentence(widget.attrs.topic)),
      _.map(widget.attrs.topic.online, this.lineItem),
    ])
  },

  lineItem(user) {
    return h('div.babble-sidebar-line-item', { attributes: { 'data-user-card': user.username } }, [
      avatarImg('small', { template: user.avatar_template, username: user.username }),
      h('div.babble-siderbar-name', user.username)
    ])
  }
})
