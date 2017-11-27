
import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget     = widget
    this.post       = widget.state.post
    return [this.button(), this.dropdown()]
  },

  button() {
    if (this.post.deleted_at || !_.compact(this.actions()).length) { return }
    return this.widget.attach('link', { icon: 'chevron-down', action: 'open' })
  },

  dropdown() {
    if (!this.widget.state.open) { return }
    return this.actions()
  },

  actions() {
    return [this.delete(), this.edit(), this.flag()]
  },

  edit() {
    if (this.post.can_edit) {
      return this.widget.attach('link', { icon: 'pencil', action: 'edit', label: 'post.controls.edit_action' })
    }
  },

  flag() {
    // if (this.post.can_flag) {
    return this.widget.attach('link', { icon: 'flag', action: 'flag', label: 'post.actions.flag' })
    // }
  },

  delete() {
    if (this.post.can_delete) {
      return this.widget.attach('link', { icon: 'trash-o', action: 'delete', label: 'user.admin_delete' })
    }
  }

})
