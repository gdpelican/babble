import forEachTopicContainer from './for-each-topic-container'
import userSearch from 'discourse/lib/user-search'
import { translations } from 'pretty-text/emoji/data'
import { emojiSearch } from 'pretty-text/emoji'
import { emojiUrlFor } from 'discourse/lib/text'
import { findRawTemplate } from 'discourse/lib/raw-templates'

let resizeChat = function(topic) {
  forEachTopicContainer(topic, function($container) {
    let $chat = $($container).find('.babble-chat')
    if (!$chat) { return }

    let siblings = $($container).siblings().toArray()
    let nonChatHeight = siblings.reduce(function(height, elem) {
      return height + elem.clientHeight
    }, parseInt(window.getComputedStyle(document.getElementById('main-outlet')).paddingTop))

    $($chat).height(window.innerHeight - nonChatHeight + 45)
    document.getElementById('list-area').style.marginBottom = 0
  })
}

let scrollToPost = function(topic, postNumber, speed = 400, offset = 30) {
  Ember.run.scheduleOnce('afterRender', () => {
    forEachTopicContainer(topic, function($container) {
      let $post = $container.find(`.babble-post[data-post-number=${postNumber}]`)
      if (!$post.length) { return }

      let animateTarget = $post.position().top + $container.scrollTop() - offset
      $container.animate({ scrollTop: animateTarget }, speed)
    })
  })
}

let setupComposer = function(topic, opts = {}) {
  return forEachTopicContainer(topic, function($container) {
    const $textarea  = $($container).find('.babble-post-composer textarea[babble-composer=inactive]')
    if (!$textarea) { return }

    if (opts.emojis) {
      $textarea.autocomplete({
        template: findRawTemplate('emoji-selector-autocomplete'),
        key: ":",

        transformComplete(v) {
          if (!v.code) { return }
          return `${v.code}:`
        },

        dataSource(term) {
          return new Ember.RSVP.Promise(resolve => {
            term = term.toLowerCase()
            var options = (term === "" && ['smile', 'smiley', 'wink', 'sunny', 'blush']) ||
                          translations[`:${term}`] ||
                          emojiSearch(term, {maxResults: 5})
            return resolve(options)
          }).then(list => list.map(code => {
            return {code, src: emojiUrlFor(code)};
          }))
        }
      })
    }

    if (opts.mentions) {
      $textarea.autocomplete({
        template: findRawTemplate('user-selector-autocomplete'),
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

      $textarea.attr('babble-composer', 'active')
      $textarea.focus()
    }

    return $textarea
  })
}

let resetComposer = function(topic) {
  forEachTopicContainer(topic, function($container) {
    let event = document.createEvent('Event')
    let $composer = $($container).find('.babble-post-composer textarea[babble-composer=active]')[0]
    event.initEvent('autosize:update', true, false)
    $composer.dispatchEvent(event)
  })
}

let rerender = function(topic) {
  forEachTopicContainer(topic, function($container) { $container.queueRerender() })
}

export { resizeChat, scrollToPost, setupComposer, resetComposer, rerender }
