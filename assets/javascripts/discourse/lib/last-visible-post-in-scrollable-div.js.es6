import isElementInScrollableDiv from "./is-element-in-scrollable-div";

export default function (container) {
  return _.max(_.map(container.find('.babble-post-container'), function(post) {
    var postElement = $(post)
    if (isElementInScrollableDiv(postElement.parent(), container)) {
      return postElement.data('post-number')
    }
  }))
}
