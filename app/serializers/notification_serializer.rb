NotificationSerializer.class_eval do
  module ChatSlug
    def slug
      return super unless object.topic && object.topic.archetype == Archetype.chat
      "chat/#{super}"
    end
  end
  prepend ChatSlug
end
