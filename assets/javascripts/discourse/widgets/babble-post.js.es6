import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import { avatarImg } from 'discourse/widgets/post';

export default createWidget('babble-post', {
  tagName: 'li.babble-post',

  defaultState(attrs) {
    var post = attrs.post
    return {
      post: post,
      isStaged: Boolean(post.id === -1)
    };
  },

  edit() {
    var post = this.state.post
    Discourse.Babble.set('editingPostId', post.id)
  },

  delete() {
    var post = this.state.post
    this.state.isStaged = true
    Discourse.ajax(`/babble/topics/${post.topic_id}/destroy/${post.id}`, {
      type: 'DELETE',
    }).then(Discourse.Babble.handleNewPost, () => {

    }).finally(() => {
      this.state.isStaged = false
    })
  },

  postDropDown(post) {
    var dropDownContents = [ h('li', { id: 'delete', action: 'delete'}, [
        h('span.icon.fa.fa-trash-o'),
        h('div', h('span', 'Delete'))
    ])]

    if (!post.image_count) {
        dropDownContents.push(h('li', { id: 'edit', action: 'edit'}, [
          h('span.icon.fa.fa-pencil'),
          h('div', h('span', 'Edit'))
        ]))
    }
    var postDropdown = h('div.btn-group', [
      h('button.btn.standard.dropdown-toggle'),
      h('ul.dropdown-menu', dropDownContents)
    ])

    return postDropdown
  },

  html(){
    var post = this.state.post,
        isEditing = Boolean(Discourse.Babble.editingPostId === post.id),
        isStaged = this.state.isStaged;

    var postClasses = ['babble', 'post-container', 'boxed']
    if(post.user_deleted){postClasses.push('babble-post-user-deleted')}
    if(post.deleted_at){postClasses.push('babble-post-staff-deleted')}
    if(isStaged){postClasses.push('babble-post-staged')}
    if(isEditing){postClasses.push('babble-post-editing')}

    if (post.user_id) {
      var avatarContents = avatarImg('small', {template: post.avatar_template, username: post.username})
    } else {
      var avatarContents = h('i.fa.fa-trash-o.deleted-user-avatar')
    }

    if (isEditing) {
      var postContents = this.attach('babble-composer', {post: post, isEditing: isEditing})
    } else {
      var postContents = h('.regular', h('.cooked', {innerHTML: post.cooked}))
    }

    var infoContents = [h('a.post-date', post.created_at )]

    if (!post.deleted_at && (post.can_edit || post.can_delete)) {
      infoContents.push(this.postDropDown(post))
    }

    if (post.deleted_at) {
      infoContents.push(h('div', h('i.fa.fa-trash-o')))
    }

    return h('div', {
      className: postClasses,
      attributes: {
        'data-post-id': post.id,
        'data-user-id': post.user_id,
        'data-post-number': post.post_number
      }}, h('.row', [
        h('.babble-post-avatar.babble-post-content', h('.contents', avatarContents)),
        h('.babble-post-body.babble-post-content', postContents),
        h('.babble-post-meta-data.babble-post-content', h('.post-info', infoContents))
      ])
    )
  }
})
