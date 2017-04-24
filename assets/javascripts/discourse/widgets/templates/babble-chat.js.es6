import { h } from 'virtual-dom'
import { isFollowOn, isNewDay } from '../../lib/chat-topic-utils'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.topic           = this.widget.attrs.topic
    if (!this.topic) { return }
    return h('div.babble-list', { attributes: { 'scroll-container': 'inactive' } }, [
      this.pressurePlate('desc'),
      h('ul', {className: 'babble-posts'}, this.chatView()),
      this.pressurePlate('asc')
    ])
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
          isFollowOn: isFollowOn(post, posts[index-1]),
          isNewDay: isNewDay(post, posts[index-1])
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
