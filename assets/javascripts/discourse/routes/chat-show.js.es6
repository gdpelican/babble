import Babble from '../lib/babble';
import PermissionType from 'discourse/models/permission-type';
import CategoryList from 'discourse/models/category-list';
import Category from 'discourse/models/category';
import Topic from 'discourse/models/topic';
import { ajax } from 'discourse/lib/ajax';

export default Discourse.Route.extend({

  model(params) {
    const category = Category.findBySlug(params.category);
    if (!category) {
      return Category.reloadBySlug(params.category).then((attrs) => {
        const record = this.store.createRecord('category', attrs.category);
        record.setupGroupsAndPermissions();
        this.site.updateCategory(record);
        return { category: Category.findBySlug(params.category) };
      });
    };
    return { category };
  },

  afterModel(model, transition) {
    if (!model) {
      this.replaceWith('/404');
      return;
    }

    return Em.RSVP.all([this._createSubcategoryList(model.category),
                        this._retrieveChat(model.category)]);
  },

  _createSubcategoryList(category) {
    this._categoryList = null;
    if (Em.isNone(category.get('parentCategory')) && Discourse.SiteSettings.show_subcategory_list) {
      return CategoryList.listForParent(this.store, category).then(list => this._categoryList = list);
    }

    // If we're not loading a subcategory list just resolve
    return Em.RSVP.resolve();
  },

  _retrieveChat(category) {
    return ajax(`/chat/${category.slug}/${category.chat_topic_id}.json`).then(function(data) {
      Babble.setCurrentTopic(data)
      return Em.RSVP.resolve();
    })
  },

  setupController(controller, model) {
    const category = model.category,
          canCreateTopicOnCategory = category.get('permission') === PermissionType.FULL;

    this.controllerFor('navigation/category').setProperties({
      category,
      filterMode: '',
      isChat: true,
      canCreateTopicOnCategory: canCreateTopicOnCategory,
      cannotCreateTopicOnCategory: !canCreateTopicOnCategory,
      canCreateTopic: true
    });

    this.searchService.set('searchContext', category.get('searchContext'));
  },

  renderTemplate() {
    this.render('navigation/category', { into: 'discovery', outlet: 'navigation-bar' });

    if (this._categoryList) {
      this.render('discovery/categories', { into: 'discovery', outlet: 'header-list-container', model: this._categoryList });
    }
    this.render('chat', { into: 'discovery', outlet: 'list-container', controller: 'chat' });
  },

  deactivate() {
    this._super();
    this.controllerFor('navigation/category').set('isChat', false)
    this.searchService.set('searchContext', null);
  },

  actions: {
    setNotification(notification_level) {
      this.currentModel.setNotification(notification_level);
    }
  }
})
