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
    this.setChatHeight()
    Babble.setupAfterRender()
  },

  setChatHeight() {
    let navHeight = 0;
    $('#main-outlet').children().not('#user-card, .list-container').each(function(){
      navHeight += $(this).outerHeight(true);
    });
    let headerHeight = parseInt($('#main-outlet').css('padding-top').replace("px", ""), 10)
    let bottomPadding = this.site.mobileView ? 10 : 20
    let difference = headerHeight + navHeight + bottomPadding
    let height = $(window).height() - difference
    $('.babble-chat').css('height', height)
  }
});
