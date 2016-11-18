import { on } from "ember-addons/ember-computed-decorators";

export default Ember.View.extend({
  @on("didInsertElement")
  setUp() {
    let buffer = this.site.mobileView ? '70px' : '100px'
    $('#main-outlet').css({
      display: '-webkit-flex',
      flexDirection: 'column',
      height: `calc(100vh - ${buffer})`
    });
    $('.list-container').css({
      position: 'relative',
      flex: 1
    });
    $('#list-area').css('margin-bottom', 'initial');
  },

  @on("willDestroyElement")
  cleanUp() {
    $('#main-outlet').css({
      display: 'block',
      flexDirection: 'initial',
      height: 'auto'
    });
    $('.list-container').css({
      position: 'initial',
      flex: 'initial'
    });
    $('#list-area').css('margin-bottom', '100px');
  }
})
