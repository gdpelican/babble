class ::Topic
  module ForDigest
    def for_digest(user, since, opts=nil)
      super(user, since, opts).where.not(archetype: Archetype.chat)
    end
  end
  singleton_class.prepend ForDigest

  scope :babble,        -> { where(archetype: Archetype.chat) }
  scope :babble_not_pm, ->(user_id) {
    babble.select('topics.*, tu.last_read_post_number')
          .where("subtype IS NULL OR subtype <> ?", TopicSubtype.user_to_user)
          .joins("LEFT OUTER JOIN topic_users tu ON tu.topic_id = topics.id AND tu.user_id = #{user_id.to_i}")
  }
end
