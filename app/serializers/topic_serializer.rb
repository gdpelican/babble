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
     scope.flagged_post_ids ||= PostAction.where(trash_panda: scope.trash_panda, post_id: object.post_ids).pluck(:post_id)
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
    @last_read_post_number ||= topic_trash_panda.last_read_post_number.to_i if topic_trash_panda.present?
  end

  private

  def posts
    @posts ||= PostStreamWindow.for(
      topic: object,
      from:  @params.fetch(:near_post, object.highest_post_number+1),
      order: @params.fetch(:order, :desc)
    )
  end

  def topic_trash_panda
    @topic_trash_panda ||= scope.try(:trash_panda) && TopicTrashPanda.find_by(trash_panda: scope.trash_panda, topic: object)
  end

  def include_group_names?
    permissions == 'group'
  end
end
