import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-chat'
import Category from 'discourse/models/category'
import DiscourseURL from 'discourse/lib/url'
import Babble from '../lib/babble'

export default createWidget('babble-chat', {
  tagName: 'div.babble-chat',

  buildKey(attrs) { return 'babbleChat' },

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      category: Category.findById(attrs.topic.category_id),
      container: attrs.container,
      fullpage: attrs.fullpage
    }
  },

  loadPostsForward() {
    Babble.loadPosts(this.state.topic, 'asc')
  },

  loadPostsBackward() {
    Babble.loadPosts(this.state.topic, 'desc')
  },

  goToChat() {
    if (!Discourse.SiteSettings.babble_full_page || !this.state.category || !this.state.topic) { return }
    this.sendWidgetAction('toggleBabble')
    DiscourseURL.routeTo(`/chat/${this.state.category.slug}/${this.state.topic.id}`)
  },

  html() { return template.render(this) }
});
