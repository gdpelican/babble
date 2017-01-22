export default Ember.Object.create({
  _topics: {},
  _components: {},
  _bindings: new Set(),

  bind(component, topic) {
    this._bindings.add([
      this.store(topic, '_topics', 'id').id,
      this.store(component, '_components', 'elementId').elementId
    ])
    console.log("Bound!", this._bindings)
  },

  unbind(component) {
    let componentBinding = _.find(Array.from(this._bindings), ([x, elementId]) => { return elementId == component.elementId })
    this._bindings.delete(componentBinding)
    console.log("Unbound!", this._bindings)
  },

  store(model, cache, field) {
    if (!this[cache][model[field]]) { this[cache][model[field]] = model }
    return this[cache][model[field]]
  },

  componentsForTopic(topic) {
    let elementIds = _.filter(Array.from(this._bindings), ([topicId, x]) => { return topicId == topic.id })
                      .map((c) => { return c[1] })
    return _.values(_.pick(this._components, elementIds))
  },

  topicForComponent(component) {
    let [topicId, x] = _.find(Array.from(this._bindings), ([x, elementId]) => { return elementId == component.elementId }) || []
    return this._topics[topicId]
  }
})
