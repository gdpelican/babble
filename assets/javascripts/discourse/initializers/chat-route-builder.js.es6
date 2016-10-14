import buildCategoryRoute from 'discourse/routes/build-category-route';

export default {
  name: 'chat-route-builder',
  initialize(container, app) {
    const site = container.lookup('site:main');
    const ChatShowRoute = container.lookupFactory('route:chat-show');

    app["ChatShowCategoryRoute"] = ChatShowRoute.extend();
    app["ChatShowParentCategoryRoute"] = ChatShowRoute.extend();
  }
};
