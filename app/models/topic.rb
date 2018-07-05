class ::Topic
  module ForDigest
    def for_digest(user, since, opts=nil)
      super(user, since, opts).where.not(archetype: Archetype.chat)
    end
  end
  singleton_class.prepend ForDigest

  scope :babble,        -> { where(archetype: Archetype.chat) }
  scope :babble_not_pm, ->(user_id, unread = false) {
    query = select('topics.*')
      .joins("LEFT OUTER JOIN topic_users tu ON tu.topic_id = topics.id AND tu.user_id = #{user_id}")
      .where(archetype: Archetype.chat)
      .where("subtype IS NULL OR subtype <> ?", TopicSubtype.user_to_user)
    query = query.where('tu.last_read_post_number < topics.highest_post_number') if unread
    query
  }
end
