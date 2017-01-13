export default function () {
  let $container = document.querySelector('#main-outlet .container.list-container')
  let $chat      = document.querySelector('#main-outlet .babble-chat')
  if (!$container || !$chat) { return }
  let siblings = $($container).siblings().toArray()
  let nonChatHeight = siblings.reduce(function(height, elem) {
    return height + elem.clientHeight
  }, parseInt(window.getComputedStyle(document.getElementById('main-outlet')).paddingTop))

  $($chat).height(window.innerHeight - nonChatHeight + 45)
  document.getElementById('list-area').style.marginBottom = 0
}
