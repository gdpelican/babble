import MountWidget from 'discourse/components/mount-widget'

export default MountWidget.extend({
  widget: 'babble-chat',

  buildArgs() {
    return {
      topic: this.get('babbleTopic'),
      lastReadPostNumber: this.get('babbleTopic.last_read_post_number'),
      fullpage: this.get('fullpage'),
      canSignUp: this.get('application.canSignUp')
    }
  }
})
