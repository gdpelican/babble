import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return h('div.babble-typing.clearfix', this.typingSentence(widget.state.topic.typing))
  },

  typingSentence(typing) {
    let usernames = _.select(_.keys(typing), function(username) {
      return typing[username].lastTyped > moment().add(-1, 'second')
    })

    if (!usernames.length) { return }
    setTimeout(() => { this.widget.scheduleRerender() }, 2000)
    switch(usernames.length) {
      case 1: return I18n.t("babble.typing.single", { first: usernames[0] })
      case 2: return I18n.t("babble.typing.double", { first: usernames[0], second: usernames[1] })
      case 3: return I18n.t("babble.typing.several")
    }
  }
})
