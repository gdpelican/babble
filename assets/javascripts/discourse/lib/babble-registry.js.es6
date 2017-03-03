export default Ember.Object.create({
  _topics: {},
  _components: {},
  _bindings: [],

  bind(component, topic) {
    this._bindings.push([
      this.store(topic, '_topics', 'id').id,
      this.store(component, '_components', 'elementId').elementId
    ])
    return this.topicForComponent(component)
  },

  unbind(component) {
    let componentBinding = _.find(this._bindings, ([x, elementId]) => { return elementId == component.elementId })
    this._bindings = _.without(this._bindings, componentBinding)
  },

  store(model, cache, field) {
    if (!this[cache][model[field]]) { this[cache][model[field]] = model }
    return this[cache][model[field]]
  },

  componentsForTopic(topic) {
    let elementIds = _.filter(this._bindings, ([topicId, x]) => { return topicId == topic.id })
                      .map((c) => { return c[1] })
    return _.values(_.pick(this._components, elementIds))
  },

  topicForComponent(component) {
    let [topicId, x] = _.find(this._bindings, ([x, elementId]) => { return elementId == component.elementId }) || []
    return this._topics[topicId]
  }
})
