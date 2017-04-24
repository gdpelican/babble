import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'
import { onlineSentence } from '../../lib/chat-topic-utils'

export default Ember.Object.create({
  render(widget) {
    const displayedUsersCount = 3
    const online = widget.attrs.topic.online
    if (!Discourse.SiteSettings.babble_whos_online) { return }
    if (!online.length) { return }

    return h('div.babble-online',
      _.map(_.take(online, displayedUsersCount), this.portrait).concat(
        this.moreCount(widget.attrs.topic, online.length-displayedUsersCount)
      )
    )
  },

  portrait(user) {
    return avatarImg('small', { template: user.avatar_template, username: user.username })
  },

  moreCount(topic, count) {
    if (count <= 0) { return }
    return h('div.avatar.babble-more-online', { attributes: { title: onlineSentence(topic) } },`+${count}`)
  }
})
