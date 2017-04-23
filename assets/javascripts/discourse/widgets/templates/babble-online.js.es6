import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    if (!Discourse.SiteSettings.babble_whos_online) { return }
    const topic = widget.state.topic
    let online = _.flatten([topic.online, topic.online, topic.online, topic.online])

    return h('div.babble-online.clearfix', [
      this.title(online.length, widget.state.fullpage),
      this.portraits(online)
    ])
  },

  title(count, fullpage) {
    if (!fullpage) { return }
    return h('h4.babble-online-message', `${count} users online`)
  },

  portraits(online) {
    if (!online.length) { return }
    return h('div.babble-online-avatars',
      _.map(_.take(online, 3), this.portrait).concat(this.moreCount(online.length-3))
    )
  },

  moreCount(count) {
    if (count > 0) { return h('div.avatar.babble-more-online', `+${count}`) }
  },

  portrait(user) {
    return avatarImg('small', {template: user.avatar_template, username: user.username })
  }
})
