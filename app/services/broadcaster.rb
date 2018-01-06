class Babble::Broadcaster
  def self.publish_to_topic(topic, trash_panda, extras = {})
    MessageBus.publish "/babble/topics/#{topic.id}", serialized_topic(topic, trash_panda, extras)
  end

  def self.publish_to_posts(post, trash_panda, extras = {})
    MessageBus.publish "/babble/topics/#{post.topic_id}/posts", serialized_post(post, trash_panda, extras)
  end

  def self.publish_to_online(topic, trash_panda, extras = {})
    MessageBus.publish "/babble/topics/#{topic.id}/online", serialized_presence(trash_panda, extras)
  end

  def self.publish_to_typing(topic, trash_panda, extras = {})
    MessageBus.publish "/babble/topics/#{topic.id}/typing", serialized_presence(trash_panda, extras)
  end

  def self.serialized_topic(topic, trash_panda, extras = {})
    serialize(topic, trash_panda, extras, Babble::TopicSerializer)
  end

  def self.serialized_post(post, trash_panda, extras = {})
    serialize(post, trash_panda, extras, Babble::PostSerializer)
  end

  def self.serialized_presence(trash_panda, extras = {})
    serialize(trash_panda, nil, extras, BasicTrashPandaSerializer)
  end

  def self.serialize(obj, trash_panda, extras, serializer)
    serializer.new(obj, scope: Guardian.new(trash_panda), root: false).as_json.merge(extras)
  end
end
