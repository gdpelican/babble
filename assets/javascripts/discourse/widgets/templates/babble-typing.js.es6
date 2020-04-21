import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget

    const typing = widget.state.topic.typing
    const now = moment().add(-3, 'second')

    const typers = Object.values(widget.state.topic.typing).filter(({ lastTyped }) => lastTyped > now)
    if (!typers.length) { return }
    setTimeout(() => { this.widget.scheduleRerender() }, 2000)

    return typers.map(({ user: { username, avatar_template } }) => (
      h('div.babble-post-container.babble-typing-container', [
        h('a.babble-avatar-wrapper', {
          attributes: { 'data-user-card': username, 'href': `/u/${username}` }
        }, avatarImg('medium', { username, template: avatar_template })),
        h('div.babble-typing', [h('span'), h('span'), h('span')])
      ])
    ))
  }
})
