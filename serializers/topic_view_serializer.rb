class ::Babble::TopicViewSerializer < ::TopicViewSerializer
  attributes :group_names, :last_posted_at
  def group_names
    object.topic.allowed_groups.pluck(:name).map(&:humanize)
  end

  def posts
    @posts ||= object.posts.map do |p|
      ps = Babble::PostSerializer.new(p, scope: scope, root: false)
      ps.topic_view = object
      ps.as_json
    end
  end

  # details are expensive to calculate and we don't use them
  def include_details?
    false
  end
end
