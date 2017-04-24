import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    return h('.babble-fullpage', [
      h('div.babble-fullpage-contents.babble-topic-container', [
        widget.attach('babble-chat', { topic: widget.state.topic }),
        widget.attach('babble-typing', { topic: widget.state.topic }),
        widget.attach('babble-composer', { topic: widget.state.topic })
      ]),
      widget.attach('babble-sidebar', { topic: widget.state.topic })
    ])
  }
})
