export default Discourse.Route.extend({
  beforeModel(transition) {
    const params = this.paramsFor('topic')
    this.replaceWith('chat.showCategory', params.slug, params.id);
  }
});
