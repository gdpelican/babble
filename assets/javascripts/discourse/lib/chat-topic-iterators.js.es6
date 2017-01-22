import BabbleRegistry from './babble-registry'

let forEachTopicComponent = function(topic, fn) {
  BabbleRegistry.componentsForTopic(topic).map(fn)
}

let forEachTopicContainer = function(topic, fn) {
  return forEachTopicComponent(topic, function(component) { return fn($(component.element)) })
}

export { forEachTopicContainer, forEachTopicComponent }
