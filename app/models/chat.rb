Babble::BootData = Struct.new(:topics, :users, :notifications)                               { alias :read_attribute_for_serialization :send }
Babble::Summary  = Struct.new(:topic_count, :unread_count, :notification_count, :default_id) { alias :read_attribute_for_serialization :send }

class ::Babble::Chat
  def self.boot_data_for(guardian)
    Babble::BootData.new(
      available_topics_for(guardian, pm: false).select('tu.last_read_post_number'),
      available_pms_for(guardian),
      notifications_for(guardian)
    )
  end

  def self.summary_for(guardian)
    Babble::Summary.new(
      available_topics_for(guardian, pm: false).count,
      available_topics_for(guardian, pm: false, unread: true).count,
      notifications_for(guardian).count,
      available_topics_for(guardian, pm: false).first&.id
    )
  end

  def self.save_topic(params = {}, topic = nil)
    class_name = params.fetch(:permissions, :group).to_s.camelize
    "::Babble::Chats::#{class_name}".constantize.new(params, topic).save!
  end

  def self.destroy_topic(topic, user)
    topic.tap do |t|
      ::Babble::PostDestroyer.new(user, topic.ordered_posts.first).destroy     if topic.ordered_posts.any?
    end.destroy
  end

  def self.available_topics_for(guardian, pm: true, unread: false)
    user_id = guardian.user.id unless guardian.anonymous?
    query = if pm then ::Topic.babble else ::Topic.babble_not_pm(user_id.to_i, unread) end
    return query if guardian.is_admin?

    category_ids = ::Category.post_create_allowed(guardian).pluck(:id)
    query.distinct
         .joins("LEFT OUTER JOIN topic_allowed_groups tg ON tg.topic_id = topics.id")
         .joins("LEFT OUTER JOIN group_users gu ON gu.group_id = tg.group_id")
         .where("gu.user_id = ? OR topics.category_id IN (?)", user_id, category_ids)
  end

  def self.available_pms_for(guardian)
    return User.none unless pms_enabled_for?(guardian)
    User.select('users.*, topics.last_posted_at')
        .real
        .joins(:user_option)
        .joins("LEFT OUTER JOIN group_users ON group_users.user_id = users.id AND group_users.group_id IN (#{chat_groups_for(guardian).join(',')})")
        .joins("LEFT OUTER JOIN topic_allowed_groups tag ON tag.group_id = group_users.group_id")
        .joins("LEFT OUTER JOIN topics ON topics.id = tag.topic_id")
        .where(active: true, "user_options.allow_private_messages": true)
        .where.not(id: guardian.user.id)
        .order('topics.last_posted_at DESC NULLS LAST')
        .limit(SiteSetting.babble_initial_user_count)
  end

  def self.unread_topics_for(guardian)
    TopicUser.where(topic: Babble::Chat.available_topics_for(@guardian), user: @user)
             .joins(:topic)
             .where("topics.highest_post_number > topic_users.last_read_post_number")
  end

  def self.chat_groups_for(guardian)
    Topic.where(archetype: Archetype.chat, subtype: TopicSubtype.user_to_user)
         .joins(:topic_allowed_groups)
         .joins("LEFT OUTER JOIN group_users ON group_users.group_id = topic_allowed_groups.group_id")
         .where("group_users.user_id": guardian.user.id)
         .pluck(:"group_users.group_id")
         .presence || [-1]
  end

  def self.notifications_for(guardian)
    ::Notification.babble.where(user: guardian.user).unread
  end

  def self.pms_enabled_for?(guardian)
    !guardian.anonymous? &&
    SiteSetting.babble_enable_pms &&
    SiteSetting.enable_personal_messages &&
    SiteSetting.min_trust_to_send_messages <= guardian.user.trust_level
  end
end
