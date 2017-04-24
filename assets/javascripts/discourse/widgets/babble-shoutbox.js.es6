import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-shoutbox'
import Babble from '../lib/babble'
import DiscourseURL from 'discourse/lib/url'
import Category from 'discourse/models/category'
import { ajax } from 'discourse/lib/ajax'

export default createWidget('babble-shoutbox', {
  tagName:  'div.babble-shoutbox',

  buildKey(attrs) {
    return `babble-shoutbox-${attrs.topic.id}`
  },

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      category: Category.findById(attrs.topic.category_id),
      availableTopics: attrs.availableTopics
    }
  },

  toggleView(topic) {
    this.state.viewingChannels = !this.state.viewingChannels
    if(topic) { this.sendWidgetAction('changeTopic', topic) }
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
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

  html() {
    return template.render(this)
  }
});
