import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    return h('div.babble-typing.clearfix', this.typingSentence(widget.state.topic.typing))
  },

  typingSentence(typing) {
    let trash_pandanames = _.select(_.keys(typing), function(trash_pandaname) {
      return typing[trash_pandaname].lastTyped > moment().add(-1, 'second')
    })

    if (!trash_pandanames.length) { return }
    setTimeout(() => { this.widget.scheduleRerender() }, 2000)
    switch(trash_pandanames.length) {
      case 1: return `${trash_pandanames[0]} is typing...`
      case 2: return `${trash_pandanames[0]} and ${trash_pandanames[1]} are typing...`
      case 3: return `several people are typing...`
    }
  }
})
