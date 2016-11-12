export default function ($container, $element) {
  if (!($container && $element.length)) { return }
  let elementTop      = $element.position().top
  let elementBottom   = elementTop + $element.height()
  let containerTop    = $container.position().top
  let containerBottom = containerTop + $container.height()
  return (elementBottom > containerTop && elementTop <= containerBottom)
}
