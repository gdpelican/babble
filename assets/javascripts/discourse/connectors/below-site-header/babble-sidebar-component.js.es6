import { createPopper } from "@popperjs/core";
import { schedule } from '@ember/runloop';

const appEvents = Discourse.__container__.lookup('service:app-events');

export default {
  setupComponent(args, component) {
    appEvents.on('babble-emoji-picker:open', this, $composer => {
      this.set('active', true);

      schedule("afterRender", () => {
        if (!this.site.isMobileDevice) {
          const button = document.querySelector(".babble-composer-action.emoji-button");
          const picker = document.querySelector(".babble-emoji-picker .emoji-picker");
                    
          if (!button || !picker) return false;
          
          this._popper = createPopper(
            button,
            picker,
            {
              placement: "auto",
              modifiers: [
                {
                  name: "preventOverflow",
                },
                {
                  name: "offset",
                  options: {
                    offset: [5, 5],
                  },
                },
              ],
            }
          );
        }      
      });
      
      this.set('emojiSelected', code => {
        $composer.val($composer.val() + ` :${code}:`)
        this.set('active', false)
      })
    })
    $('html').on('keydown.babble-emoji-picker', e => {
      if (e.which != 27) { return }
      this.set('active', false)
    })
    $('html').on('click.babble-emoji-picker', e => {
      if ($(e.target).closest('.babble-emoji-picker').length) { return }
      this.set('active', false)
    })
  },

  teardownComponent(args, component) {
    appEvents.off('babble-emoji-picker:open')
    $('html').off('keydown.babble-emoji-picker')
    $('html').off('click.babble-emoji-picker')
  }
}
