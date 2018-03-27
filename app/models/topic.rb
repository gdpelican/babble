class ::Topic
  module ForDigest
    def for_digest(user, since, opts=nil)
      super(user, since, opts).where.not(archetype: Archetype.chat)
    end
  end
  singleton_class.prepend ForDigest

  scope :babble,        -> { where(archetype: Archetype.chat) }
  scope :babble_not_pm, -> { babble.where("subtype IS NULL OR subtype <> ?", TopicSubtype.user_to_user) }
end
