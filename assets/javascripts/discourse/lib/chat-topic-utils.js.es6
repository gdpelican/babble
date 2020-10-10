import { rerender } from './chat-component-utils'
import PostStream from 'discourse/models/post-stream'
import User from 'discourse/models/user'

let syncWithPostStream = function(topic) {
  let postNumbers = topic.postStream.posts.map((p) => p.post_number);
  topic.set('firstLoadedPostNumber', Math.min.apply(Math, postNumbers))
  topic.set('lastLoadedPostNumber',  Math.max.apply(Math, postNumbers))
  topic.set('unreadCount',           unreadCount(topic))
  return rerender(topic)
}

let unreadCount = function(topic) {
  return !latestPostIsMine(topic) && topic.highest_post_number > topic.last_read_post_number ? 1 : 0
}

let latestPostFor = function(topic) {
  return Math.max.apply(Math, topic.postStream.posts.map((p) => p.post_number));
}

let latestPostIsMine = function(topic) {
  let latestPost  = latestPostFor(topic)
  let currentUser = User.current()
  if (!currentUser || !latestPost) { return false }
  return latestPostFor(topic).user_id == currentUser.id
}

// a post is a 'follow-on' if it's another post by the same author within 2 minutes.
// edited posts cannot be follow-ons, as we want to show that they're edited in the header.
let isFollowOn = function(post, previous) {
  return previous &&
         !previous.deleted_at &&
         !(post.self_edits > 0) &&
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
  topic.set('postStream', postStream)
  topic.typing = {}
  topic.online = {}
  return topic
}

export { syncWithPostStream, latestPostFor, latestPostIsMine, isFollowOn, isNewDay, teardownPresence, setupLastReadMarker, applyPostStream }
