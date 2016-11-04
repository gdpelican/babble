import { on } from "ember-addons/ember-computed-decorators";

export default Ember.View.extend({
  @on("didInsertElement")
  setUp() {
    $('#list-area').css('margin-bottom', 'initial');
  },

  @on("willDestroyElement")
  cleanUp() {
    $('#list-area').css('margin-bottom', '100px');
  }
})
