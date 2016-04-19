class ::Babble::Topic

  def self.create_topic(params)
    return false unless params[:title].present?
    save_topic Topic.new, {
      user: Discourse.system_user,
      category: Babble::Category.instance,
      title: params[:title],
      visible: false,
      allowed_groups: get_allowed_groups(params[:allowed_group_ids])
    }
  end

  def self.update_topic(topic, params)
    return false unless params[:title].present?
    save_topic topic, {
      title: params[:title],
      allowed_groups: get_allowed_groups(params[:allowed_group_ids])
    }
  end

  def self.save_topic(topic, params)
    topic.tap do |t|
      t.assign_attributes(params)
      t.save(validate: false) if t.valid? || t.errors.to_hash.except(:title).empty?
    end
  end
  private_class_method :save_topic

  def self.get_allowed_groups(ids)
    Group.where(id: Array(ids)).presence || default_allowed_groups
  end

  def self.set_default_allowed_groups(topic)
    topic.allowed_group_ids << default_allowed_groups unless topic.allowed_groups.any?
  end

  def self.default_allowed_groups
    Group.find Array Group::AUTO_GROUPS[:trust_level_0]
  end

  def self.prune_topic(topic)
    topic.posts.order(created_at: :desc).offset(SiteSetting.babble_max_topic_size).destroy_all
    topic.update(user: Discourse.system_user)
  end

  def self.default_topic_for(user)
    available_topics_for(user).first
  end

  def self.available_topics
    Babble::Category.instance.topics.includes(:allowed_groups)
  end

  def self.available_topics_for(user)
    available_topics.joins(:allowed_group_users).where("? OR group_users.user_id = ?", user.admin, user.id).uniq
  end

  # NB: the set_default_allowed_groups block is passed for backwards compatibility,
  # so that we never have a topic which has no allowed groups.
  def self.find(id)
    available_topics.find_by(id: id).tap { |topic| set_default_allowed_groups(topic) if topic }
  end
end
