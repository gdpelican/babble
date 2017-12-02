let lookup = function(key) {
  return Discourse.__container__.lookup(key)
}

let messageBus = function() {
  return lookup('message-bus:main')
}

let apiPath = function(topic, action) {
  return `/babble/topics/${topic.id}/${action}`
}

let setupLiveUpdate = function(topic, fns) {
  _.each(fns, (fn, action) => { messageBus().subscribe(apiPath(topic, action), fn) })
}

let teardownLiveUpdate = function(topic, ...actions) {
  _.each(actions, (action) => { messageBus().unsubscribe(apiPath(topic, action)) })
}

let updateUnread = function(topic) {
  let appEvents = lookup('component:babble-sidebar-component').appEvents
  appEvents.trigger('babble-update-unread', (topic.highest_post_number - topic.last_read_post_number) > 0)
}

export { setupLiveUpdate, teardownLiveUpdate, updateUnread, messageBus }
