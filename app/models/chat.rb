Babble::BootData = Struct.new(:topics, :users, :notifications)    { alias :read_attribute_for_serialization :send }
Babble::Summary  = Struct.new(:unread_count, :notification_count) { alias :read_attribute_for_serialization :send }

class ::Babble::Chat
  def self.boot_data_for(guardian)
    Babble::BootData.new(
      available_topics_for(guardian, pm: false).select('tu.last_read_post_number'),
      available_pms_for(guardian, limit: 10),
      notifications_for(guardian)
    )
  end

  def self.summary_for(guardian)
    Babble::Summary.new(
      available_topics_for(guardian, pm: false, unread: true).count,
      notifications_for(guardian).count
    )
  end

  def self.save_topic(params = {}, topic = nil)
    class_name = params.fetch(:permissions, :group).to_s.camelize
    "::Babble::Chats::#{class_name}".constantize.new(params, topic).save!
  end

  def self.destroy_topic(topic, user)
    topic.tap do |t|
      topic.category.tap { |c| c.custom_fields['chat_topic_id'] = nil }.save if topic.category
      ::Babble::PostDestroyer.new(user, topic.ordered_posts.first).destroy     if topic.ordered_posts.any?
    end.destroy
  end

  def self.available_topics_for(guardian, pm: true, unread: false)
    user_id = guardian.user.id unless guardian.anonymous?
    query = if pm then ::Topic.babble else ::Topic.babble_not_pm(guardian.user, unread) end
    return query if guardian.is_admin?

    category_ids = ::Category.post_create_allowed(guardian).pluck(:id)
    query.distinct
         .joins("LEFT OUTER JOIN topic_allowed_groups tg ON tg.topic_id = topics.id")
         .joins("LEFT OUTER JOIN group_users gu ON gu.group_id = tg.group_id")
         .where("gu.user_id = ? OR topics.category_id IN (?)", user_id, category_ids)
  end

  def self.available_pms_for(guardian, limit:)
    if pms_enabled_for?(guardian)
      User.babble_pm_list.where.not(id: guardian.user.id).limit(limit || 10)
    else
      User.none
    end
  end

  def self.unread_topics_for(guardian)
    TopicUser.where(topic: Babble::Chat.available_topics_for(@guardian), user: @user)
             .joins(:topic)
             .where("topics.highest_post_number > topic_users.last_read_post_number")
  end

  def self.notifications_for(guardian)
    ::Notification.babble.where(user: guardian.user).unread
  end

  def self.pms_enabled_for?(guardian)
    SiteSetting.babble_enable_pms &&
    SiteSetting.enable_personal_messages &&
    SiteSetting.min_trust_to_send_messages <= guardian.user.trust_level
  end
end
