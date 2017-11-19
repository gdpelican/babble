NotificationSerializer.class_eval do
  module ChatSlug
    def data
      return super unless object.topic && object.topic.archetype == Archetype.chat
      super.merge(chat_topic_id: object.topic_id, post_number: object.post_number)
    end
  end
  prepend ChatSlug
end
