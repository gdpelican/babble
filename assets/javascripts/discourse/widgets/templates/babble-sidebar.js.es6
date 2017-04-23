import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    const displayedUsersCount = 3
    const online = widget.attrs.topic.online
    if (!Discourse.SiteSettings.babble_whos_online) { return }

    return h('div.babble-sidebar', [
      h('h4.babble-sidebar-title', this.title(online)),
      _.map(online, this.lineItem),
    ])
  },

  title(online) {
    if (online.length == 1) {
      return I18n.t("babble.sidebar_title_single_user")
    } else {
      return I18n.t("babble.sidebar_title", { count: online.length })
    }
  },

  lineItem(user) {
    return h('div.babble-sidebar-line-item', { attributes: { 'data-user-card': user.username } }, [
      avatarImg('small', { template: user.avatar_template, username: user.username }),
      h('div.babble-siderbar-name', user.username)
    ])
  }
})
