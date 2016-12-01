export default Discourse.Route.extend({
  beforeModel() {
    const params = this.paramsFor('topic');
    const postParams = this.paramsFor('topic.redirectNear');
    this.replaceWith('chat.showCategoryNear', params.slug, params.id, postParams.nearPost);
  }
});
