import MountWidget from 'discourse/components/mount-widget'
import Babble from '../lib/babble'

export default MountWidget.extend({
  widget: 'babble-chat',

  buildArgs() {
    let topic = Babble.topicForComponent(this)
    return {
      topic: topic,
      lastReadPostNumber: topic.last_read_post_number,
      fullpage: this.get('fullpage'),
      canSignUp: this.get('application.canSignUp')
    }
  }
})
