
import { h } from 'virtual-dom'
import Babble from '../../lib/babble'

export default Ember.Object.create({
  render(widget) {
    this.widget          = widget
    this.availableTopics = this.widget.attrs.availableTopics || []
    return this.topicsList()
  },

  topicsList() {
    return h('div.babble-list', h('ul.babble-available-topics', this.availableTopicsList()))
  },

  availableTopicsList() {
    return this.availableTopics.map(t => { return this.availableTopicListItem(t) })
  },

  availableTopicListItem(topic) {
    return h('li.babble-available-topic.row', [
      this.availableTopicLink(topic),
      this.loadingSpinner(Babble.loadingTopicId === topic.id)
    ])
  },

  availableTopicLink(topic) {
    return this.widget.attach('link', {
      className: 'normalized',
      rawLabel: topic.title,
      action: 'changeTopic',
      actionParam: topic
    })
  },

  loadingSpinner(visible) {
    if (!visible) { return }
    return h('div.spinner-container', h('div.spinner'))
  }

})
