export default Ember.Object.create({
  _topics: {},
  _components: {},
  _users: {},
  _notifications: {},
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

  store(model, cache, field, force = false) {
    if (force || !this[cache][model[field]]) { this[cache][model[field]] = model }
    return this[cache][model[field]]
  },

  storeTopic(topic) {
    this.store(topic, '_topics', 'id', true)
    return this.fetchTopic(topic.id)
  },

  storeUser(user) {
    this.store(user, '_users', 'id', true)
    return this.fetchUser(user.id)
  },

  storeNotification(notification) {
    this.store(notification, '_notifications', 'id')
    return this.fetchNotification(notification.id)
  },

  fetchTopic(topicId) {
    return this._topics[topicId]
  },

  fetchUser(userId) {
    return this._users[userId]
  },

  fetchNotification(notificationId) {
    return this._notifications[notificationId]
  },

  allTopics() {
    return _.values(this._topics)
  },

  allUsers() {
    return _.values(this._users)
  },

  allNotifications() {
    return _.values(this._notifications)
  },

  removeNotification(id) {
    delete this._notifications[id]
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
