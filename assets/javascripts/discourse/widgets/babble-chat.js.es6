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
      topic:    attrs.topic,
      category: Category.findById(attrs.topic.category_id),
      csrf:     attrs.csrf
    }
  },

  loadPostsForward() {
    Babble.loadPosts(this.state.topic, 'asc')
  },

  loadPostsBackward() {
    Babble.loadPosts(this.state.topic, 'desc')
  },

  html() { return template.render(this) }
});
