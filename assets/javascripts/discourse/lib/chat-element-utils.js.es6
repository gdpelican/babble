import { forEachTopicContainer } from './chat-topic-iterators'
import userSearch from 'discourse/lib/user-search'
import { translations } from 'pretty-text/emoji/data'
import { emojiSearch } from 'pretty-text/emoji'
import { emojiUrlFor } from 'discourse/lib/text'
import { findRawTemplate } from 'discourse/lib/raw-templates'
import debounce from 'discourse/lib/debounce'
import autosize from 'discourse/lib/autosize'
import User from 'discourse/models/user'
import Site from 'discourse/models/site'
import Babble from '../lib/babble'

let scrollToPost = function(topic, postNumber, speed = 400, offset = 60) {
  Ember.run.scheduleOnce('afterRender', () => {
    forEachTopicContainer(topic, function($container) {
      if (!hasChatElements($container)) { return }

      let $scrollContainer = $container.find('.babble-list')
      let $post = $container.find(`.babble-post[data-post-number=${postNumber}]`)
      if (!$post.length || !$scrollContainer.length) { return }

      let postWidth = $post.find('.babble-post-content-wrapper').width()
      $scrollContainer.find('.babble-post-content img[height]').toArray().map((img) => {
        let fullHeight = parseInt(img.attributes.height.value)
        let fullWidth  = parseInt(img.attributes.width.value)
        var viewHeight
        var viewWidth
        if (fullHeight <= postWidth && fullWidth <= postWidth) {
          viewHeight = fullHeight
          viewWidth = fullWidth
        } else {
          viewHeight = postWidth * fullHeight / fullWidth
          viewWidth = postWidth
        }
        img.style.height = `${viewHeight}px`
        img.style.width = `${viewWidth}px`
      })

      let animateTarget = $post.position().top + $scrollContainer.scrollTop() - offset
      $scrollContainer.animate({ scrollTop: animateTarget }, speed)
    })
  })
}

let setupScrollContainer = function(topic) {
  forEachTopicContainer(topic, function($container) {
    if (!hasChatElements($container)) { return }

    let $scrollContainer = $($container).find('.babble-list[scroll-container=inactive]')
    if (!$scrollContainer.length) { console.warn("Babble scroll container already active or could not be found"); return }

    $($scrollContainer).on('scroll.discourse-babble-scroll', debounce(() => {
      $container.find('.babble-post-actions-menu').hide()
      Babble.ensureRead(topic, $container)
    }, 500))
    Babble.ensureRead(topic, $container)

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
              var options = (term === "" && ['smile', 'smiley', 'wink', 'sunny', 'blush']) ||
                            translations[`:${term}`] ||
                            emojiSearch(term, {maxResults: 5})
              return resolve(options)
            }).then(list => _.flatten([list]).map(code => {
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
              exclude: [User.currentProp('username')]
            })
          },

          transformComplete(v) {
            return v.username || v.name
          }
        })

        $textarea.attr('babble-composer', 'active')
        if (!Site.current().isMobileDevice) {
          $textarea.focus()
        }
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

let positionDropdown = function(e, menuSelector, dropdownWidth = 150, delay = 100) {
  const rect = document.elementFromPoint(e.clientX, e.clientY).closest('.btn').getBoundingClientRect()
  setTimeout(() => {
    const menu = document.querySelector(menuSelector)
    menu.style.top  = `${rect.top}px`
    if (document.body.offsetWidth > rect.left + dropdownWidth) {
      menu.style.left = `${rect.left}px`
    } else {
      menu.style.right = `${document.body.offsetWidth - rect.right}px`
    }
  }, delay)
}

let setupChannelAutocomplete = function(opts = {}) {
  setTimeout(() => {
    const $input = $(document.querySelector(`.babble-${opts.type}-autocomplete input`))
    $input.autocomplete({
      template:      findRawTemplate(opts.template),
      onChangeItems: (items) => { opts.onSelect(items[0]) },
      dataSource:    opts.source
    })
    $input.focus()
  }, 100)
}

let playNotification = function() {
  const $audio = $('audio#babble-notification')[0]
  if (!$audio || !$audio.play) { return }
  $audio.play()
}

export {
  scrollToPost,
  setupScrollContainer,
  setupComposer,
  teardownComposer,
  hasChatElements,
  positionDropdown,
  setupChannelAutocomplete,
  playNotification
}
