let forEachTopicContainer = function(topic, fn) {
  return forEachTopicComponent(topic, function(component) {
    return fn($(component.element))
  })
}

let forEachTopicComponent = function(topic, fn) {
  return (topic.get('babbleComponents') || []).map(fn)
}

export { forEachTopicContainer, forEachTopicComponent }
