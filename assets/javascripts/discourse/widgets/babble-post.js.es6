import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import Babble from '../lib/babble'
import RawHtml from 'discourse/widgets/raw-html';
import { avatarImg } from 'discourse/widgets/post';
import { dateNode } from 'discourse/helpers/node';

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
  },

  html(){
    let post = this.state.post
    if (post.deleted_at) {
      var postContents = h('div.babble-deleted-post', I18n.t("babble.post_deleted_by", {username: post.deleted_by.username}))
    } else if (Babble.editingPostId === post.id) {
      var postContents = this.attach('babble-composer', {post: post, isEditing: true})
    } else if (Babble.loadingEditId === post.id) {
      var postContents = h('div.spinner-container', h('div.spinner'))
    } else {
      let avatar = post.user_id ? avatarImg('small', {template: post.avatar_template, username: post.username})
                   : h('i.fa.fa-trash-o.deleted-user-avatar'),
          cooked = new RawHtml({ html: `<div class="babble-post-cooked">${Discourse.Emoji.unescape(post.cooked)}</div>` }),
          content = [ h('div.babble-post-date', dateNode(post.created_at)), cooked ];

      if(!post.deleted_at) {
        let actions = []
        if (post.can_delete) {
          actions.push(this.attach('link', { icon: 'trash-o', action: 'delete' }))
        }
        if (post.can_edit) {
          actions.push(this.attach('link', { icon: 'pencil', action: 'edit' }))
        }
        if (actions.length > 0) {
          content.push(h('div.babble-post-actions', actions))
        }
      }

      var postContents = [
        h('div', {className: 'babble-post-avatar'}, h('div', avatar)),
        h('div', {className: 'babble-post-content'}, content)
      ]
    }

    return h('div', {
      className: 'babble-post-container',
      attributes: {
        'data-post-id': post.id,
        'data-user-id': post.user_id,
        'data-post-number': post.post_number
      }}, postContents)
  }
})
