import { rerender } from './chat-component-utils'
import PostStream from 'discourse/models/post-stream'

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
  rerender(topic)
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

// a post is a 'follow-on' if it's another post by the same author within 2 minutes.
// edited posts cannot be follow-ons, as we want to show that they're edited in the header.
let isFollowOn = function(post, previous) {
  return previous &&
         !previous.deleted_at &&
         !post.self_edits > 0 &&
         previous.user_id == post.user_id &&
         moment(post.created_at).add(-2, 'minute') < moment(previous.created_at)
}

// a post displays a date separator if it's the first post of the day
let isNewDay = function(post, previous) {
  return previous &&
         moment(post.created_at).date() > moment(previous.created_at).date()
}

let teardownPresence = function(topic) {
  clearInterval(topic.pingWhilePresent)
}

let setupLastReadMarker = function(topic) {
  if (topic.last_read_post_number < topic.highest_post_number) {
    topic.set('lastReadMarker', topic.last_read_post_number)
  } else {
    topic.set('lastReadMarker', null)
  }
}

let applyPostStream = function(topic) {
  let postStream = PostStream.create(topic.post_stream)
  postStream.topic = topic
  postStream.updateFromJson(topic.post_stream)
  topic.postStream = postStream
  topic.typing = {}
  topic.online = {}
  return topic
}

export { syncWithPostStream, latestPostFor, latestPostIsMine, isFollowOn, isNewDay, teardownPresence, setupLastReadMarker, applyPostStream }
