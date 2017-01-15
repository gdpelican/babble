export default function(topic, fn) {
  return (topic.get('babbleContainers') || []).map(function(selector) {
    fn($(selector))
  })
}
