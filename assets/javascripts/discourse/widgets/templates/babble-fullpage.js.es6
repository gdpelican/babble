import { h } from 'virtual-dom'
import { avatarImg } from 'discourse/widgets/post'

export default Ember.Object.create({
  render(widget) {
    return h('.babble-fullpage', [
      widget.attach('babble-chat', { topic: widget.state.topic }),
      widget.attach('babble-composer', { topic: widget.state.topic })
    ])
  }
})
