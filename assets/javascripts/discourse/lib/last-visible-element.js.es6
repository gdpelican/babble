import elementIsVisible from './element-is-visible'

export default function ($container, selector, attr) {
  if (!$container) { return }
  return _.max($container.find(selector).map(function(index, element) {
    let $element = $(element)
    if (elementIsVisible($container, $element)) { return $element.data(attr) }
  }))
}
