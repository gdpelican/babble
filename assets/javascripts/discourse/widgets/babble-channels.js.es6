import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-channels'
import Babble from '../lib/babble'
import { ajax } from 'discourse/lib/ajax'
import userSearch from 'discourse/lib/user-search'
import { findRawTemplate } from 'discourse/lib/raw-templates'
import { setupChannelAutocomplete } from '../lib/chat-element-utils'

export default createWidget('babble-channels', {
  tagName: 'div.babble-channels',

  buildKey(attrs) { return 'babbleChannels' },
  defaultState(attrs) { return { search: {} } },

  changeTopic(model) {
    var action
    switch(model.constructor) {
      case Discourse.User:  action = 'loadPM'; break
      case Discourse.Topic: action = 'loadTopic'; break
    }
    Babble[action](model.id).then((topic) => {
      this.sendWidgetAction('open', topic)
    }, console.log)
  },

  pmsSearch() {
    this.state.search.pms = true
    setupChannelAutocomplete({
      type: 'pms',
      template: 'user-selector-autocomplete',
      onSelect: (item) => {
        this.changeTopic(Discourse.User.create({ id: item.username }))
      },
      source: (term) => {
        return userSearch({
          term: term,
          exclude: ['discobot', 'system', Discourse.User.current().get('username')]
        })
      }
    })
  },

  html() { return template.render(this) }
})
