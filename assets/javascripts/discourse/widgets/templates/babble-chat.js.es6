import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.topic           = this.widget.attrs.topic
    this.availableTopics = this.widget.attrs.availableTopics || []
    this.canSignUp       = this.widget.attrs.canSignUp
    if (!this.topic) { return }
    return this.chatContents()
  },

  chatContents() {
    let contents = [
      h('div.babble-list', { attributes: { 'scroll-container': 'inactive' } }, [
        this.pressurePlate('desc'),
        h('ul', {className: 'babble-posts'}, this.chatView()),
        this.pressurePlate('asc')
      ]),
      this.widget.attach('babble-presence', { topic: this.topic }),
      this.widget.attach('babble-composer', { topic: this.topic, canSignUp: this.canSignUp })
    ]
    if (!this.widget.attrs.fullpage) {
      contents.unshift(
        h('div.babble-title-wrapper', h('div.babble-title', [
          this.chatTitle(),
          this.visibilityButton(),
          this.exchangeTopicsButton()
        ]))
      )
    }
    return contents
  },

  pressurePlate(order) {
    if (!this.topic.postStream.posts.length) { return }
    if (order === 'asc' && this.topic.highest_post_number == this.topic.lastLoadedPostNumber) { return }
    return h('div.babble-load-more', this.pressurePlateMessage(order))
  },

  pressurePlateMessage(order) {
    var canLoadMore, actionName

    switch(order) {
      case 'desc':
        actionName = 'loadPostsBackward'
        canLoadMore = this.topic.firstLoadedPostNumber > 1
        break
      case 'asc':
        actionName = 'loadPostsForward'
        canLoadMore = this.topic.lastLoadedPostNumber  < this.topic.highest_post_number
        break
    }

    if (this.topic.loadingPosts) {
      return h('div.babble-load-message', I18n.t('babble.loading_messages'))
    } else if (canLoadMore) {
      return this.widget.attach('button', {
        label:     'babble.load_more',
        className: `babble-load-message babble-pressure-plate ${order}`,
        action:    actionName
      })
    } else {
      return h('div.babble-load-message', I18n.t('babble.no_more_messages'))
    }
  },

  chatTitle() {
    return h('h4.babble-group-title', this.topic.title)
  },

  visibilityButton() {
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className:    'normalized',
      icon:         'eye',
      title:        'babble.topic_visibility_tooltip',
      titleOptions: { groupNames: this.topic.group_names }
    }))
  },

  exchangeTopicsButton() {
    if (this.availableTopics.length == 0) { return }
    return h('div.babble-context-toggle.for-chat', this.widget.attach('button', {
      className: 'normalized',
      icon:      'exchange',
      action:    'toggleView',
      title:     'babble.view_topics_tooltip'
    }))
  },

  chatView() {
    let stream = this.topic.postStream
    if (stream.loadingBelow) {
      return this.loadingSpinner()
    } else if (stream.posts.length) {
      let posts = stream.posts.sort((a,b) => { return a.post_number - b.post_number })
      return posts.map((post, index) => {
        return this.widget.attach('babble-post', {
          post: post,
          topic: this.topic,
          // a post is a 'follow-on' if it's another post by the same author within 2 minutes.
          // edited posts cannot be follow-ons, as we want to show that they're edited in the header.
          isFollowOn: !(post.self_edits > 0) &&
                      posts[index-1] &&
                      posts[index-1].user_id == post.user_id &&
                      moment(posts[index-1].created_at) > moment(post.created_at).add(-2, 'minute'),
          // a post displays a date separator if it's the first post of the day
          isNewDay: posts[index-1] &&
                    moment(posts[index-1].created_at).date() != moment(post.created_at).date()
        })
      })
    } else {
      return h('li.babble-empty-topic-message', I18n.t('babble.empty_topic_message'))
    }
  },

  loadingSpinner() {
    return h('div.spinner-container', h('div.spinner'))
  }
})
