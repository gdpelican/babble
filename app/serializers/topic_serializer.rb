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

  def initialize(object, opts)
    super(object, opts)
    @params = opts[:params] || {}
  end

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
    posts = object.posts.includes(:user).order(post_number: :desc)
    nearPost = (@params || {}).fetch(:near_post, nil).to_i
    highestPost = object.highest_post_number
    limit = SiteSetting.babble_page_size

    if nearPost && (highestPost > limit)
      buffer = limit / 2
      nearBeginning = nearPost < buffer
      nearEnd = nearPost > (highestPost - buffer)

      if nearBeginning
        startRange = 0
        endRange = limit
      elsif nearEnd
        startRange = highestPost - limit
        endRange = highestPost
      else
        startRange = nearPost - buffer
        endRange = nearPost + buffer
      end

      posts = posts.where(:post_number => (startRange)..(endRange))
    else
      posts = posts.limit(limit)
    end
    posts
  end

  def topic_user
    @topic_user ||= scope.try(:user) && TopicUser.find_by(user: scope.user, topic: object)
  end

  def include_group_names?
    permissions == 'group'
  end
end
