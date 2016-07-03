export default function (container, selector, attr) {
  if (!container) { return }
  return _.max(_.map(container.find(selector), function(e) {
    let elem = $(e)
    let elemPosition = elem.position().top
    if (elemPosition + elem.height() <= 0 || elemPosition > container.height()) { return }
    return parseInt(elem.data(attr))
  }))
}
