import { forEachTopicComponent } from './chat-topic-iterators'

let rerender = function(topic) {
  forEachTopicComponent(topic, function(component) { component.queueRerender() })
}

export { rerender }
