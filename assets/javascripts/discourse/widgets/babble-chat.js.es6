import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-chat'
import DiscourseURL from 'discourse/lib/url'
import Babble from '../lib/babble'

export default createWidget('babble-chat', {
  tagName: 'div.babble-chat',

  buildKey(attrs) { return `babble-chat-${attrs.topic.id}` },

  defaultState(attrs) {
    return { topic: attrs.topic }
  },

  loadPostsForward() {
    Babble.loadPosts(this.state.topic, 'asc')
  },

  loadPostsBackward() {
    Babble.loadPosts(this.state.topic, 'desc')
  },

  html() { return template.render(this) }
});
