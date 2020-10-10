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
  Object.entries(fns).forEach((x) => messageBus().subscribe(apiPath(topic, x[0]), x[1]));
}

let teardownLiveUpdate = function(topic, ...actions) {
  actions.forEach((action) => { messageBus().unsubscribe(apiPath(topic, action)) })
}

export { setupLiveUpdate, teardownLiveUpdate, messageBus }