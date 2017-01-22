class ::UserAction
  module ApplyCommonFilters
    def apply_common_filters(builder, user_id, guardian, ignore_private_messages=false)
      builder.where("t.archetype <> :chat", chat: Archetype.chat)
      super(builder, user_id, guardian, ignore_private_messages)
    end
  end
  singleton_class.prepend ApplyCommonFilters
end
