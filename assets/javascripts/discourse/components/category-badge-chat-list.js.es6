import Category from 'discourse/models/category';

export default Ember.Component.extend({
  tagName: 'div',

  category: function() {
    return Category.findById(this.get('categoryId'))
  }.property()
})
