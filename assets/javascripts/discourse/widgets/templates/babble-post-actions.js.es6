
import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget     = widget
    this.post       = widget.state.post
    if (this.post.deleted_at || !_.compact(this.actions()).length) { return }

    if (widget.state.open) {
      return h('div.babble-post-actions.opened', this.dropdown())
    } else {
      return h('button.babble-post-actions.closed', this.button())
    }
  },

  button() {
    return this.widget.attach('link', { class: 'wark', icon: 'chevron-down', action: 'open' })
  },

  dropdown() {
    if (!this.widget.state.open) { return }
    return this.actions()
  },

  actions() {
    return [this.edit(), this.flag(), this.delete()]
  },

  edit() {
    if (this.post.can_edit) {
      return this.widget.attach('link', { icon: 'pencil', action: 'edit', label: 'post.controls.edit_action' })
    }
  },

  flag() {
    // if (this.post.can_flag) {
    // return this.widget.attach('link', { icon: 'flag', action: 'flag', label: 'post.actions.flag' })
    // }
    return // WIP
  },

  delete() {
    if (this.post.can_delete) {
      return this.widget.attach('link', { icon: 'trash-o', action: 'delete', label: 'user.admin_delete' })
    }
  }

})
