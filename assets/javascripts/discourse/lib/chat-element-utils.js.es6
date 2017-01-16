import { forEachTopicContainer } from './chat-topic-iterators'
import userSearch from 'discourse/lib/user-search'
import { translations } from 'pretty-text/emoji/data'
import { emojiSearch } from 'pretty-text/emoji'
import { emojiUrlFor } from 'discourse/lib/text'
import { findRawTemplate } from 'discourse/lib/raw-templates'
import debounce from 'discourse/lib/debounce'
import lastVisibleElement from '../lib/last-visible-element'

let resizeChat = function(topic) {
  forEachTopicContainer(topic, function($container) {
    let $chat = $($container).find('.babble-chat')
    if (!$chat) { return }

    let $nonChatElements = $($container).siblings().toArray()
    let nonChatHeight = $nonChatElements.reduce(function(height, elem) {
      return height + elem.clientHeight
    }, parseInt(window.getComputedStyle(document.getElementById('main-outlet')).paddingTop))

    $($chat).height(window.innerHeight - nonChatHeight + 40)
    document.getElementById('list-area').style.marginBottom = 0
  })
}

let scrollToPost = function(topic, postNumber, speed = 400, offset = 30) {
  Ember.run.scheduleOnce('afterRender', () => {
    forEachTopicContainer(topic, function($container) {
      let $scrollContainer = $container.find('.babble-list')
      let $post = $container.find(`.babble-post[data-post-number=${postNumber}]`)
      if (!$post.length || !$scrollContainer.length) { return }

      let animateTarget = $post.position().top + $scrollContainer.scrollTop() - offset
      $scrollContainer.animate({ scrollTop: animateTarget }, speed)
    })
  })
}

let setupScrollContainer = function(topic, readFn) {
  forEachTopicContainer(topic, function($container) {
    let $scrollContainer = $($container).find('.babble-list[scroll-container=inactive]')
    if (!$scrollContainer) { return }

    $($scrollContainer).on('scroll.discourse-babble-scroll', debounce((e) => {
      readFn(topic, lastVisibleElement($container, '.babble-post', 'post-number'))
    }, 500))
    $($scrollContainer).trigger('scroll.discourse-babble-scroll')

    // Mark scroll container as activated
    $container.attr('scroll-container', 'active')
    return $container
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

export { resizeChat, scrollToPost, setupScrollContainer, setupComposer, resetComposer }
