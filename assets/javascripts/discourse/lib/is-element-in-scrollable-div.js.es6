export default function (element, container) {
  return element.position().top + element.height() > 0 &&
         element.position().top < container.height()
}
