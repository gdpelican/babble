export default Discourse.Route.extend({
  beforeModel(transition) {
    const params = this.paramsFor('topic');
    const postParams = this.paramsFor('topic.redirectNear');
    this.replaceWith('chat.showCategoryNear', params.slug, params.id, postParams.nearPost);
  }
});
