export default function (container, selector, attr) {
  if (!container) { return }
  return _.max(_.map(container.find(selector), function(e) {
    let elem = $(e)
    let elemTop         = elem.position().top
    let elemBottom      = elemTop + elem.height()
    let containerTop    = container.position().top
    let containerBottom = containerTop + container.height()
    if (elemBottom <= containerTop || elemTop > containerBottom) { return }
    return parseInt(elem.data(attr))
  }))
}
