import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    const displayedUsersCount = 3
    const online = widget.state.topic.online
    if (!Discourse.SiteSettings.babble_whos_online) { return }
    if (!online.length) { return }

    return h('div.babble-online.babble-online-shoutbox',
      _.map(_.take(online, displayedUsersCount), this.portrait).concat(this.moreCount(online.length-displayedUsersCount))
    )
  },

  portrait(user) {
    return avatarImg('small', { template: user.avatar_template, username: user.username })
  },

  moreCount(count) {
    if (count > 0) { return h('div.avatar.babble-more-online', `+${count}`) }
  }
})
