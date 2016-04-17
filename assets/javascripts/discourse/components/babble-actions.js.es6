import DropdownButton from 'discourse/components/dropdown-button';
import { iconHTML } from 'discourse/helpers/fa-icon';

export default DropdownButton.extend({
  classNames: ['babble-post-actions'],
  text: iconHTML('ellipsis-h'),
  target: Em.computed.alias('topic'),

  hidden: function(){
    return !(this.get('post.can_edit') || this.get('post.can_delete') || this.get('post.flagsAvailable.length'))
  }.property('post.can_edit', 'post.can_delete', 'post.flagsAvailable'),

  dropDownContent: function() {
    var content = [
      {
       id: 'delete',
       title: '',
       description: 'Delete',
       styleClasses: 'fa fa-trash-o'
      }
    ]
    if (!this.get('post.image_count')) {
      content.push(
        {
         id: 'edit',
         title: '',
         description: 'Edit',
         styleClasses: 'fa fa-pencil'
        }
      )
    }
    return content
  }.property(),

  clicked: function(id) {
    this.get(`actions.${id}`)()
  }

});
