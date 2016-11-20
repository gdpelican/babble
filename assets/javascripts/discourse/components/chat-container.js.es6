import MountWidget from 'discourse/components/mount-widget';
import Babble from '../lib/babble';

export default MountWidget.extend({
  widget: 'babble-chat',

  init() {
    this._super();
    Babble.set('container', this)
  },

  buildArgs() {
    return {
      topic: this.get('topic'),
      fullpage: this.get('fullpage'),
      firstLoadedPostNumber: Babble.get('firstLoadedPostNumber'),
      lastLoadedPostNumber: Babble.get('lastLoadedPostNumber'),
      lastReadPostNumber: this.lastReadPostNumber(),
      canSignUp: this.get('application.canSignUp')
    };
  },

  lastReadPostNumber() {
    if (this.get('topic.last_read_post_number') == this.get('topic.highest_post_number')) { return }
    return this.get('topic.last_read_post_number')
  },

  didInsertElement() {
    this._super();
    Babble.setupAfterRender(this.get('nearPost'))
  },

  afterPatch() {
    Babble.setupAfterRender()
  }
});
