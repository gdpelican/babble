import Babble from '../lib/babble'
import userSearch from 'discourse/lib/user-search'

export default function ($textarea, opts = {}) {
  if (!$textarea) { return }

  if (opts.emojis) {
    $textarea.autocomplete({
      template: Discourse.__container__.lookup('template:emoji-selector-autocomplete.raw'),
      key: ":",

      transformComplete(v) {
        if (!v.code) { return }
        return `${v.code}:`
      },

      dataSource(term) {
        return new Ember.RSVP.Promise(resolve => {
          term = term.toLowerCase()
          var options = (term === "" && ['smile', 'smiley', 'wink', 'sunny', 'blush']) ||
                        Discourse.Emoji.translations[`:${term}`] ||
                        Discourse.Emoji.search(term, {maxResults: 5})
          return resolve(options)
        }).then(list => list.map(code => {
          return {code, src: Discourse.Emoji.urlFor(code)};
        }))
      }
    })
  }

  if (opts.mentions) {
    $textarea.autocomplete({
      template: Discourse.__container__.lookup('template:user-selector-autocomplete.raw'),
      key: '@',
      dataSource(term) {
        return userSearch({
          term: term,
          topicId: opts.topicId,
          includeGroups: true,
          exclude: [Discourse.User.current().get('username')]
        })
      },

      transformComplete(v) {
        return v.username || v.name
      }
    })

    $textarea.focus()
    return $textarea
  }
}
