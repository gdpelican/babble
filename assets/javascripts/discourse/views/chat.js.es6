import { on } from "ember-addons/ember-computed-decorators";

export default Ember.View.extend({
  @on("didInsertElement")
  setUp() {
    $('#main-outlet').css({
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 100px)'
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
      display: 'initial',
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
