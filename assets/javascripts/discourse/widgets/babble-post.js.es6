import { createWidget } from 'discourse/widgets/widget';
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post'

export default createWidget('babble-post', {
  tagName: 'li.babble-post',

  defaultState(attrs) {
    return { post: attrs.post }
  },

  edit() {
    Babble.set('editingPostId', this.state.post.id)
  },

  delete() {
    let post = this.state.post
    Babble.set('loadingEditId', post.id)
    Babble.toggleProperty('postStreamEdited')
    Discourse.ajax(`/babble/topics/${post.topic_id}/destroy/${post.id}`, {
      type: 'DELETE'
    }).finally(() => {
      Babble.set('loadingEditId', null)
      Babble.toggleProperty('queueRerender')
    })
    this.scheduleRerender()
  },

  html() { return template.render(this) }
})
