
import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget     = widget
    this.post       = widget.state.post
    this.topic      = widget.state.topic
    if (this.post.deleted_at || !_.compact(this.actions()).length) { return }
    let css = this.isLastPost() ? '.last-post' : ''

    if (widget.state.open) {
      return h(`div.babble-post-actions.opened${css}`, this.dropdown())
    } else {
      return h('div.babble-post-actions.closed', this.button())
    }
  },

  isLastPost() {
    return this.topic.highest_post_number == this.post.post_number
  },

  button() {
    return this.widget.attach('link', { icon: 'chevron-down', action: 'open' })
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
    if (this.post.can_flag) {
      if (this.post.has_flagged) {
        return h('div.widget-link.babble-link-disabled', [h('i.fa.fa-flag'), I18n.t('babble.flagged')])
      } else {
        return this.widget.attach('link', { icon: 'flag', action: 'flag', label: 'post.actions.flag' })
      }
    }
  },

  delete() {
    if (this.post.can_delete) {
      return this.widget.attach('link', { icon: 'trash-o', action: 'delete', label: 'user.admin_delete' })
    }
  }

})
