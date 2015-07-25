export default function (container) {
  if (!container) { return false }
  container = container[0]
  return container.scrollHeight - container.scrollTop === container.offsetHeight
}
