import { forEachTopicComponent } from './chat-topic-iterators'

let rerender = function(topic) {
  forEachTopicComponent(topic, function(component) {
    if (component.queueRerender) {
      component.queueRerender()
    } else {
      component.rerender()
    }
  })
  return topic
}

export { rerender }
