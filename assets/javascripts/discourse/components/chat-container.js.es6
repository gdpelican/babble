import MountWidget from 'discourse/components/mount-widget';
import Babble from '../lib/babble';

export default MountWidget.extend({
  widget: 'babble-chat',

  init() {
    this._super();
    this.args = {
      topic: this.get('topic'),
      fullpage: this.get('fullpage')
    };
    Babble.set('container', this)
  },

  afterPatch() {
    Babble.setupAfterRender()
  }
});
