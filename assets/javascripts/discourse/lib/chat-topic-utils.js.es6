let syncWithPostStream = function(topic) {
  let postNumbers = topic.postStream.posts.map(function(post) { return post.post_number })
  let unreadCount = 0
  let visibleUnreadCount = ''
  let additionalUnread = false

  if (!latestPostIsMine(topic)) {
    let totalUnreadCount  = latestPostFor(topic).post_number - topic.last_read_post_number
    let windowUnreadCount = _.min([totalUnreadCount, topic.postStream.posts.length])
    unreadCount           = windowUnreadCount
    additionalUnread      = totalUnreadCount > windowUnreadCount
  }

  if (unreadCount) {
    visibleUnreadCount = `${unreadCount}${additionalUnread ? '+' : ''}`
  }

  topic.set('firstLoadedPostNumber', _.min(postNumbers))
  topic.set('lastLoadedPostNumber',  _.max(postNumbers))
  topic.set('unreadCount',           unreadCount)
  topic.set('hasAdditionalUnread',   additionalUnread)
  topic.set('visibleUnreadCount',    visibleUnreadCount)

  return topic
}

let latestPostFor = function(topic) {
  return _.max(topic.postStream.posts, function(p) { return p.post_number })
}

let latestPostIsMine = function(topic) {
  let latestPost  = latestPostFor(topic)
  let currentUser = Discourse.User.current()
  if (!currentUser || !latestPost) { return false }
  return latestPostFor(topic).user_id == currentUser.id
}

export { syncWithPostStream, latestPostFor, latestPostIsMine }
