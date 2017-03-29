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

  goToChat(e) {
    if (!Discourse.SiteSettings.babble_full_page || !this.state.category || !this.state.topic) { return }
    this.sendWidgetAction('toggleBabble')
    let path = `/chat/${this.state.category.slug}/${this.state.topic.id}`
    if (e.ctrlKey || e.metaKey) {
      window.open(path, '_blank', 'height=500,width=200,model=yes')
    }  else {
      DiscourseURL.routeTo(path)
    }
  },

  html() { return template.render(this) }
});
