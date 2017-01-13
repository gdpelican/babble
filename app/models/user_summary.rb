UserSummary.class_eval do # why do I have to do it this way?
  module RemoveChatTopics
    def topics
      super.where('archetype <> ?', Archetype.chat)
    end

    def replies
      super.where('topics.archetype <> ?', Archetype.chat)
    end

    def links
      super.where('topics.archetype <> ?', Archetype.chat)
    end
  end
  prepend RemoveChatTopics
end
