class ::Babble::TopicSerializer < ActiveModel::Serializer
  attributes :id,
             :title,
             :category_id,
             :post_stream,
             :group_names,
             :last_posted_at,
             :permissions,
             :highest_post_number,
             :last_read_post_number

  def group_names
    object.allowed_groups.pluck(:name).map(&:humanize)
  end

  def permissions
    object.category_id.present? ? 'category' : 'group'
  end

  def post_stream
    @post_stream ||= {
      posts: ActiveModel::ArraySerializer.new(posts, each_serializer: Babble::PostSerializer, scope: scope, root: false),
      stream: posts.pluck(:id).sort
    }
  end

  def last_read_post_number
    @last_read_post_number ||= topic_user.last_read_post_number.to_i if topic_user.present?
  end

  private

  def posts
    @posts ||= PostStreamWindow.for(
      topic: object,
      from:  scope[:near_post],
      order: scope[:direction]
    ).limit(SiteSetting.babble_page_size)
  end

  def topic_user
    @topic_user ||= scope.try(:user) && TopicUser.find_by(user: scope.user, topic: object)
  end

  def include_group_names?
    permissions == 'group'
  end

  def scope
    super || {}
  end
end
