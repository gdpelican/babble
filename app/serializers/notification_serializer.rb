NotificationSerializer.class_eval do
  module ChatSlug
    def data
      return super unless object.topic && object.topic.archetype == Archetype.chat
      super.merge(chat: true)
    end
  end
  prepend ChatSlug
end
