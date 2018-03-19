class ::Babble::Chat
  def self.save_topic(params = {}, topic = nil)
    chat_class_for(params[:permissions]).new(params, topic).save!
  end

  def self.destroy_topic(topic, user)
    topic.tap do |t|
      topic.category.tap { |c| c.custom_fields['chat_topic_id'] = nil }.save if topic.category
      ::Babble::PostDestroyer.new(user, topic.ordered_posts.first).destroy     if topic.ordered_posts.any?
    end.destroy
  end

  def self.chat_class_for(class_name)
    class_name ||= :group
    "::Babble::Chats::#{class_name.to_s.camelize}".constantize
  end

  def self.available_topics_for(guardian)
    query = ::Topic.where(archetype: ::Archetype.chat)
    return query if guardian.is_admin?

    user_id      = guardian.user.id unless guardian.anonymous?
    category_ids = ::Category.post_create_allowed(guardian).pluck(:id)
    query.joins("LEFT OUTER JOIN topic_allowed_groups tg ON tg.topic_id = topics.id")
         .joins("LEFT OUTER JOIN group_users gu ON gu.group_id = tg.group_id")
         .where("gu.user_id = ? OR topics.category_id IN (?)", user_id, category_ids)
         .uniq

  end
end
