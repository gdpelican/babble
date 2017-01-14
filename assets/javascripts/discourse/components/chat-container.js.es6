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
      canSignUp: this.get('application.canSignUp')
    };
  },

  didInsertElement() {
    this._super();
    Babble.setupAfterRender(this.get('topic'), this.get('nearPost'))
  },

  afterPatch() {
    Babble.setupAfterRender(this.get('topic'))
  }
});
