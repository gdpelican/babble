import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import RawHtml from 'discourse/widgets/raw-html';
import { avatarImg } from 'discourse/widgets/post';
import { dateNode } from 'discourse/helpers/node';

export default createWidget('babble-post', {
  tagName: 'li.babble-post',

  defaultState(attrs) {
    var post = attrs.post
    return {
      post: post
    };
  },

  edit() {
    var post = this.state.post
    Discourse.Babble.set('editingPostId', post.id)
  },

  delete() {
    var post = this.state.post
    Discourse.Babble.set('loadingEditId', post.id)
    Discourse.Babble.toggleProperty('postStreamEdited')
    Discourse.ajax(`/babble/topics/${post.topic_id}/destroy/${post.id}`, {
      type: 'DELETE',
    })
  },

  html(){
    var post = this.state.post,
        isEditing = Boolean(Discourse.Babble.editingPostId === post.id),
        loadingEdit = Boolean(Discourse.Babble.loadingEditId === post.id);

    if (post.deleted_at) {
      var postContents = h('div.babble-deleted-post', I18n.t("babble.post_deleted_by", {username: post.deleted_by.username}))
    } else if (isEditing) {
      var postContents = this.attach('babble-composer', {post: post, isEditing: isEditing})
    } else if (loadingEdit) {
      var postContents = h('div.spinner-container', h('div.spinner'))
    } else {
      var avatar = post.user_id ? avatarImg('small', {template: post.avatar_template, username: post.username})
                   : h('i.fa.fa-trash-o.deleted-user-avatar'),
          cooked = new RawHtml({ html: `<div class="babble-post-cooked">${Discourse.Emoji.unescape(post.cooked)}</div>` }),
          content = [ h('div.babble-post-date', dateNode(post.created_at)), cooked ];

      if (!post.deleted_at && (post.can_edit || post.can_delete)) {
        var actions = [this.attach('link', {icon: 'trash-o', action: 'delete'})]
        if (!post.image_count) {
          actions.push(this.attach('link', {icon: 'pencil', action: 'edit'}))
        }
        content.push(h('div.babble-post-actions', actions))
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
