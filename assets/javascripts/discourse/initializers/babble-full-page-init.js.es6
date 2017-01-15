import { resizeChat } from '../lib/chat-element-utils'
import Babble from '../lib/babble'
import NavItem from 'discourse/models/nav-item'
import Category from 'discourse/models/category'
import CategoryController from 'discourse/controllers/navigation/category'
import computed from 'ember-addons/ember-computed-decorators'
import { customNavItemHref } from 'discourse/models/nav-item'
import ChatComponent from '../components/chat-container'

export default {
  name: 'babble-full-page-init',
  initialize() {
    if (!Discourse.SiteSettings.babble_full_page) { return }

    // Add full page chat to category navigation bar
    customNavItemHref(function(navItem) {
      if (navItem.get('name') != 'chat') { return }
      return Discourse.getURL(["", "chat", Category.slugFor(navItem.category), navItem.category.chat_topic_id].join('/'))
    })

    NavItem.reopen({
      displayName: function() {
        if (this.get('name') != 'chat') { return this._super() }
        let title = I18n.t('babble.nav_title')

        if (this.get('count') > 0) {
          title += ` (${this.get('count')})`
        }
        return title
      }.property('categoryName', 'name', 'count')
    })

    ChatComponent.reopen({
      selector: '#main-outlet .container.list-container',

      didInsertElement() {
        this._super()
        Babble.bind(this, true) // listens for window size
      },

      didRemoveElement() {
        this._super()
        Babble.unbind(this)
      }
    })

    CategoryController.reopen({
      @computed("showingSubcategoryList", "category", "noSubcategories")
      navItems(showingSubcategoryList, category, noSubcategories) {
        let list = this._super(showingSubcategoryList, category, noSubcategories)

        if (category && category.get('chat_topic_id') > 0) {
          let navItem = Discourse.__container__.lookup('store:main').createRecord('nav-item', {
            name:       'chat',
            filterMode: 'chat',
            category:   category
          })

          Babble.removeObserver('unreadCount')
          Babble.addObserver('unreadCount', () => {
            navItem.set('count', Babble.get('unreadCount'))
          })

          list.push(navItem)
        }

        return list
      }
    })
  }
}
