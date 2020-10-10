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
    this._bindings = this._bindings.filter(([x, elementId]) => { return elementId == component.elementId });
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
    return Object.values(this._topics)
  },

  allUsers() {
    return Object.values(this._users)
  },

  allNotifications() {
    return Object.values(this._notifications)
  },

  removeNotification(id) {
    delete this._notifications[id]
  },

  componentsForTopic(topic) {
    return this._bindings.filter(([topicId, x]) => { return topicId == topic.id })
      .map((c) => this._components[c[1]]);
  },

  topicForComponent(component) {
    let [topicId, x] = this._bindings.find(([x, elementId]) => { return elementId == component.elementId }) || []
    return this._topics[topicId]
  }
})
