import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-channels'
import Babble from '../lib/babble'
import userSearch from 'discourse/lib/user-search'
import { findRawTemplate } from 'discourse/lib/raw-templates'
import { setupChannelAutocomplete } from '../lib/chat-element-utils'

export default createWidget('babble-channels', {
  tagName: 'div.babble-channels',

  buildKey(attrs) { return 'babbleChannels' },
  defaultState(attrs) { return { search: {} } },

  changeTopic(model) {
    Babble.loadTopic(model.id, { pm: model.constructor == Discourse.User }).then((topic) => {
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
