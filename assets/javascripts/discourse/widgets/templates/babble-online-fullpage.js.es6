import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    const online = widget.state.topic.online
    if (!Discourse.SiteSettings.babble_whos_online) { return }
    if (!online.length) { return }

    return h('div.babble-online.babble-online-fullpage', _.map(online, this.listItem))
  },

  listItem(user) {
    return h('li.online-user', [
      avatarImg('small', { template: user.avatar_template, username: user.username }),
      h('span.online-username', user.username)
    ])
  }
})
