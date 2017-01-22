let messageBus = function() {
  return Discourse.__container__.lookup('message-bus:main')
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

export { setupLiveUpdate, teardownLiveUpdate }
