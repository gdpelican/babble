class ::Babble::Topic

  def self.save_topic(params, topic = Topic.new)
    case params.fetch(:permissions, 'group')
    when 'category'
      category = Category.find(params[:category_id])
      return false if params[:allowed_group_ids].present?
      return false unless [0, topic.id].include?(category.custom_fields['chat_topic_id']) # don't allow multiple channels on a single category
      params[:allowed_groups] = Group.none
      params[:title]        ||= category.name
    when 'group'
      return false if params[:category_id].present? || !params[:title].present?
      params[:allowed_groups] = get_allowed_groups(params[:allowed_group_ids])
      params[:category_id] = nil
    end

    topic.tap do |t|
      t.assign_attributes archetype: :chat, user_id: Discourse::SYSTEM_USER_ID, last_post_user_id: Discourse::SYSTEM_USER_ID
      t.assign_attributes params.except(:permissions, :allowed_group_ids)
      if t.valid? || t.errors.to_hash.except(:title).empty?
        t.save(validate: false)
        update_category(params[:category_id], t.reload.id) if params[:category_id]
      end
    end
  end

  def self.destroy_topic(topic, user)
    topic.tap do |t|
      Babble::PostDestroyer.new(user, topic.ordered_posts.first).destroy if topic.ordered_posts.any?
      update_category(topic.category_id, nil)                            if topic.category_id
    end.destroy
  end

  def self.update_category(category_id, topic_id)
    Category.find(category_id).tap { |c| c.custom_fields['chat_topic_id'] = topic_id }.save
  end

  def self.get_allowed_groups(ids)
    Group.where(id: Array(ids)).presence || default_allowed_groups
  end

  def self.set_default_allowed_groups(topic)
    topic.allowed_group_ids << default_allowed_groups unless topic.allowed_groups.any?
  end

  def self.default_allowed_groups
    Group.find Array Group::AUTO_GROUPS[:trust_level_0]
  end

  def self.default_topic_for(guardian)
    available_topics_for(guardian).first
  end

  def self.available_topics
    Topic.where(archetype: :chat).includes(:allowed_groups)
  end

  def self.available_topics_for(guardian)
    return available_topics if guardian.is_admin?
    user_id = guardian.anonymous? ? nil : guardian.user.id
    category_ids = Category.post_create_allowed(guardian).pluck(:id)
    available_topics
      .joins("LEFT OUTER JOIN topic_allowed_groups tg ON tg.topic_id = topics.id")
      .joins("LEFT OUTER JOIN group_users gu ON gu.group_id = tg.group_id")
      .where("gu.user_id = ? OR topics.category_id IN (?)", user_id, category_ids)
      .uniq
  end

  # NB: the set_default_allowed_groups block is passed for backwards compatibility,
  # so that we never have a topic which has no allowed groups.
  def self.find_by(param)
    available_topics.find_by(param).tap { |topic| set_default_allowed_groups(topic) if topic }
  end
end
