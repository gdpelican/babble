export default function (container) {
  if (!container) { return false }
  container = container.get(0)
  return container.scrollHeight - container.scrollTop - container.offsetHeight < 10
}
