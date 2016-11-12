import MountWidget from 'discourse/components/mount-widget';
import Babble from '../lib/babble';

export default MountWidget.extend({
  widget: 'babble-chat',

  init() {
    this._super();
    this.args = {
      topic: this.get('topic'),
      fullpage: this.get('fullpage'),
      lastReadPostNumber: this.lastReadPostNumber()
    };
    Babble.set('container', this)
  },

  lastReadPostNumber() {
    if (this.get('topic.last_read_post_number') == this.get('topic.highest_post_number')) { return }
    return this.get('topic.last_read_post_number')
  },

  afterPatch() {
    Babble.setupAfterRender()
  }
});
