import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    if (!Discourse.SiteSettings.babble_whos_online) { return }
    const topic = widget.state.topic
    return h('div.babble-online.clearfix', _.map(topic.online, (user) => {
      return avatarImg('small', {template: user.avatar_template, username: user.username })
    }))
  }
})
