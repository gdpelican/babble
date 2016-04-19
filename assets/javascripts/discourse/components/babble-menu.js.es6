import isElementScrolledToBottom from "../lib/is-element-scrolled-to-bottom"
import lastVisiblePostInScrollableDiv from "../lib/last-visible-post-in-scrollable-div"
import debounce from 'discourse/lib/debounce'
import { observes } from 'ember-addons/ember-computed-decorators'
import { headerHeight } from 'discourse/views/header'
const HAS_MUTATION_OBSERVER = !Ember.testing && !!window.MutationObserver;

export default Ember.Component.extend({

  isElementScrolledToBottom: isElementScrolledToBottom,
  lastVisiblePostInScrollableDiv: lastVisiblePostInScrollableDiv,
  showUpload: false,
  sendLinkedImage: null,

  ready: function() {
    return this.get('visible') && Discourse.Babble && Discourse.Babble.currentTopic
  },

  currentTopicId: function() {
    return Discourse.Babble.currentTopicId
  }.property('Discourse.Babble.currentTopicId'),

  currentTopic: function() {
    return Discourse.Babble.currentTopic
  }.property('Discourse.Babble.currentTopic'),

  availableTopics: function() {
    var currentTopicId = this.get('currentTopicId')
    return _.filter(Discourse.Babble.availableTopics, function(topic) { return topic.id != currentTopicId })
  }.property('Discourse.Babble.currentTopicId', 'Discourse.Babble.availableTopics'),

  multipleTopicsAvailable: function() {
    return this.get('availableTopics').length > 0
  }.property('availableTopics.length'),

  @observes('visible')
  _visible: function() {
    if (Discourse.Babble.disabled()) { return }
    Discourse.Babble.set('menuVisible', this.get('visible'))
    if (this.ready()) {
      Ember.run.scheduleOnce('afterRender', this, this.topicChanged)
      Ember.run.scheduleOnce('afterRender', this, this.setupObserver)
    }
  },

  watchHeight: function() {
    // I am kinda fragile. :/
    let menuPanel = $(this.element).find('.menu-panel')
    if (menuPanel.hasClass('drop-down')) { return }

    let panelBody = menuPanel.find('.panel-body')
    let postWindow = panelBody.find('.babble-posts')
    let offset = 10;
    let postWindowSiblingHeight = _.reduce(postWindow.siblings(), function(sum, s) {
      return sum + $(s).height()
    }, 0)
    postWindow.height(panelBody.height() - headerHeight() - postWindowSiblingHeight - offset)
  },

  setupObserver: function() {
    if (!HAS_MUTATION_OBSERVER) { return }
    if (!this.observer) {
      this.observer = new MutationObserver(() => {
        Ember.run.debounce(this, () => {
          Ember.run.scheduleOnce('afterRender', this, this.watchHeight)
        }, 150)
      });
    }

    this.observer.disconnect()
    if (this.get('visible')) {
      this.observer.observe(this.element, { childList: true,
                                            subtree: true,
                                            characterData: true,
                                            attributes: true })
    }
  },

  @observes('Discourse.Babble.currentTopicId')
  topicChanged: function() {
    this._actions.viewChat(this)
    $(this.element).find('.babble-post-composer').find('textarea').focus()
    this.set('initialScroll', true)
    Ember.run.scheduleOnce('afterRender', this, this.setupScrolling)
  },

  @observes('Discourse.Babble.latestPost')
  messageBusPostCallback: function() {
    let isScrolledToBottom = this.isElementScrolledToBottom(this.get('scrollContainer')),
        lastPostIsMine     = Discourse.Babble.lastPostIsMine()
    if (isScrolledToBottom || lastPostIsMine) { this.scroll() }
  },

  @observes('Discourse.Babble.editingPostId')
  scrollToEditingPost: function() {
    if (Discourse.Babble.editingPostId) {
      // focus the textarea of the post being edited
      Ember.run.scheduleOnce('afterRender', this, () => {
        $(this.element).find('.is-editing').find('textarea').focus()
        this.scroll(Discourse.Babble.editingPostId)
      })
    } else {
      $(this.element).find('.babble-post-composer').find('textarea').focus()
    }
  },

  setupScrolling: function() {
    let scrollContainer = $('.babble-menu').find('.babble-posts')
    if (!scrollContainer.length) { return }

    scrollContainer.off('scroll')
    scrollContainer.on('scroll', debounce(() => { this.read }, 500))
    this.set('scrollContainer', scrollContainer)
    this.scroll()
  },

  scroll: function(postId) {
    if (!this.get('visible')) { return }
    let scrollSpeed = this.get('initialScroll') ? 0 : 750 // Scroll immediately on initial scroll
    this.get('scrollContainer').animate({ scrollTop: this.scrollToPosition(postId) }, scrollSpeed, () => { this.read() })
    this.set('initialScroll', false)
  },

  scrollToPosition: function(postId) {
    let scrollContainer = this.get('scrollContainer')
    var targetElement
    if (postId) {
      targetElement = _.first(scrollContainer.find(`.babble-post-container[data-post-id="${postId}"]`))
    } else if (this.get('initialScroll')) {
      targetElement = _.first(scrollContainer.find('.babble-last-read-post-message'))
    }

    if (targetElement) {
      return targetElement.offsetTop - scrollContainer.offset().top + 50
    } else {
      return scrollContainer.get(0).scrollHeight
    }
  },

  read: function() {
    let lastReadPostNumber = this.lastVisiblePostInScrollableDiv(this.get('scrollContainer'))
    if (lastReadPostNumber <= this.get('currentTopic.last_read_post_number')) { return }
    Discourse.ajax('/babble/topics/' + this.get('currentTopicId') + '/read/' + lastReadPostNumber + '.json')
             .then(Discourse.Babble.setCurrentTopic)
  },

  actions: {
    viewChat:    function(context) { (context || this).set('viewingChat', true) },
    viewTopics:  function(context) { (context || this).set('viewingChat', false) },
    changeTopic: function(topic)   { Discourse.ajax('/babble/topics/' + topic.id + '.json').then(Discourse.Babble.setCurrentTopic)},
    sendLinkedImage: function(image) { this.set('sendLinkedImage', image)}
  }
});
