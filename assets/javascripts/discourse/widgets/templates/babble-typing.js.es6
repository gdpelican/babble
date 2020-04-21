import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget

    // TODO get users properly
    const users = [{ username: 'gdpelican', avatar_template: '/letter_avatar_proxy/v4/letter/g/919ad9/{size}.png' }]
    if (!users.length) { return }
    setTimeout(() => { this.widget.scheduleRerender() }, 2000)

    return users.map(({ username, avatar_template }) => (
      h('div.babble-post-container.babble-typing-container', [
        h('a.babble-avatar-wrapper', {
          attributes: { 'data-user-card': username, 'href': `/u/${username}` }
        }, avatarImg('medium', { username, template: avatar_template })),
        h('div.babble-typing', [h('span'), h('span'), h('span')])
      ])
    ))
  }
})
