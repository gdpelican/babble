import { forEachTopicContainer } from './chat-topic-iterators'
import userSearch from 'discourse/lib/user-search'
import { translations } from 'pretty-text/emoji/data'
import { emojiSearch } from 'pretty-text/emoji'
import { emojiUrlFor } from 'discourse/lib/text'
import { findRawTemplate } from 'discourse/lib/raw-templates'
import debounce from 'discourse/lib/debounce'
import autosize from 'discourse/lib/autosize'
import lastVisibleElement from '../lib/last-visible-element'
import { syncWithPostStream } from '../lib/chat-topic-utils'
import { ajax } from 'discourse/lib/ajax'
import { rerender } from '../lib/chat-component-utils'

let resizeChat = function(topic) {
  Ember.run.scheduleOnce('afterRender', () => {
    forEachTopicContainer(topic, function($container) {
      if (!hasChatElements($container)) { return }

      let $chat = $($container).find('.babble-chat')
      let $listContainer = $($container).closest('.list-container')

      let $nonChatElements = $listContainer.siblings().toArray()
      let nonChatHeight = $nonChatElements.reduce(function(height, elem) {
        return height + elem.clientHeight
      }, parseInt(window.getComputedStyle(document.getElementById('main-outlet')).paddingTop))

      $($chat).height(window.innerHeight - nonChatHeight + 40)
      document.getElementById('list-area').style.marginBottom = 0
    })
  })
}

let setupResize = function(topic) {
  $(window).on(`resize.babble-${topic.id}`, _.debounce(function() { resizeChat(topic) }, 250))
  resizeChat(topic)
}

let teardownResize = function(topic) {
  $(window).off(`resize.babble-${topic.id}`)
}

let scrollToPost = function(topic, postNumber, speed = 400, offset = 30) {
  Ember.run.scheduleOnce('afterRender', () => {
    forEachTopicContainer(topic, function($container) {
      if (!hasChatElements($container)) { return }

      let $scrollContainer = $container.find('.babble-list')
      let $post = $container.find(`.babble-post[data-post-number=${postNumber}]`)
      if (!$post.length || !$scrollContainer.length) { return }

      let animateTarget = $post.position().top + $scrollContainer.scrollTop() - offset
      $scrollContainer.animate({ scrollTop: animateTarget }, speed)
    })
  })
}

let readPost = function(topic, $container) {
  let postNumber = lastVisibleElement($container.find('.babble-chat'), '.babble-post', 'post-number')
  if (postNumber <= topic.last_read_post_number) { return }
  topic.set('last_read_post_number', postNumber)
  syncWithPostStream(topic)
  return ajax(`/babble/topics/${topic.id}/read/${postNumber}.json`)
}

let setupScrollContainer = function(topic) {
  forEachTopicContainer(topic, function($container) {
    if (!hasChatElements($container)) { return }

    let $scrollContainer = $($container).find('.babble-list[scroll-container=inactive]')
    if (!$scrollContainer.length) { console.warn("Babble scroll container already active or could not be found"); return }

    $($scrollContainer).on('scroll.discourse-babble-scroll', debounce(() => {
      readPost(topic, $container)
    }, 500))
    readPost(topic, $container)

    // Mark scroll container as activated
    $container.attr('scroll-container', 'active')
    return $container
  })
}

let setupComposer = function(topic, opts = { emojis: true, mentions: true }) {
  Ember.run.scheduleOnce('afterRender', () => {
    forEachTopicContainer(topic, function($container) {
      if (!hasChatElements($container)) { return }

      const $textarea  = $($container).find('.babble-post-composer textarea[babble-composer=inactive]')
      if (!$textarea.length) { console.warn("Babble composer already active or could not be found"); return }

      autosize($textarea)

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
              topicId: topic.id,
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
    })
  })
}

let teardownComposer = function(topic) {
  forEachTopicContainer(topic, function($container) {
    if (!hasChatElements($container)) { return }
    let $composer = $($container).find('.babble-post-composer textarea[babble-composer=active]')[0]

    let event = document.createEvent('Event')
    event.initEvent('autosize:update', true, false)
    $composer.dispatchEvent(event)
  })
}

// A component has chat elements if it renders a 'babble-chat' widget.
// This won't be the case for navbar counters or other unread tracking components.
let hasChatElements = function(element) {
  return $(element).find('.babble-chat').length
}

export { setupResize, teardownResize, scrollToPost, setupScrollContainer, setupComposer, teardownComposer, hasChatElements }
