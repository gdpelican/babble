import Babble from '../lib/babble';
import PermissionType from 'discourse/models/permission-type';
import CategoryList from 'discourse/models/category-list';
import Category from 'discourse/models/category';
import Topic from 'discourse/models/topic';
import { ajax } from 'discourse/lib/ajax';

export default Discourse.Route.extend({

  model(params) {
    let category = Category.findBySlug(params.category)
    if (category) { return category }

    Category.reloadBySlug(params.category).then((response) => {
      const record = this.store.createRecord('category', response.category);
      record.setupGroupsAndPermissions();
      this.site.updateCategory(record);
      return Category.findBySlug(params.category)
    })
  },

  afterModel(model) {
    if (!model) {
      this.replaceWith('/404');
      return;
    }
    this._categoryList = this._createSubcategoryList(model)
  },

  _createSubcategoryList(category) {
    if (!category || !category.get('parentCategory') || !Discourse.SiteStettings.show_subcategory_list) { return }
    return CategoryList.listForParent(this.store, category)
  },

  setupController(controller, model) {
    const canCreateTopicOnCategory = model.get('permission') === PermissionType.FULL;

    this.controllerFor('navigation/category').setProperties({
      category: model,
      filterMode: 'chat',
      canCreateTopicOnCategory: canCreateTopicOnCategory,
      cannotCreateTopicOnCategory: !canCreateTopicOnCategory,
      canCreateTopic: true
    });

    ajax(`/babble/topics/${model.chat_topic_id}.json`).then((data) => {
      Babble.setCurrentTopic(data)
      this.controllerFor('chat').setProperties({
        model: Babble.get('currentTopic')
      })
    })

    this.searchService.set('searchContext', model.get('searchContext'));
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
    this.controllerFor('chat').set('model', null);
    this.searchService.set('searchContext', null);
  },

  actions: {
    setNotification(notification_level) {
      this.currentModel.setNotification(notification_level);
    }
  }
})
