class Babble::Broadcaster

  def self.publish_to_topic(topic, user, extras = {})
    MessageBus.publish "/babble/topics/#{topic.id}", serialized_topic(topic, user, extras)
  end

  def self.publish_to_posts(post, user, extras = {})
    MessageBus.publish "/babble/topics/#{post.topic_id}/posts", serialized_post(post, user, extras)
  end

  def self.serialized_topic(topic, user, extras = {})
    serialize(Babble::AnonymousTopicView.new(topic.id, user), user, extras, Babble::TopicViewSerializer)
  end

  def self.serialized_post(post, user, extras = {})
    serialize(post, user, extras, Babble::PostSerializer).as_json.merge(extras)
  end

  def self.serialize(obj, user, extras, serializer)
    serializer.new(obj, scope: Guardian.new(user), root: false).as_json.merge(extras)
  end
end
