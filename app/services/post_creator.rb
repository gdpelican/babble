class ::Babble::PostCreator < ::PostCreator

  def self.create(user, opts)
    Babble::PostCreator.new(user, opts).create
  end

  def valid?
    setup_post
    errors.add :base, I18n.t(:topic_not_found) unless guardian.can_create?(Post, @topic)
    errors.add :base, "No post content"        unless @post.raw.present?
    errors.empty?
  end

  def setup_post
    super
    @topic = @post.topic = Topic.find_by(id: @opts[:topic_id])
  end

  def update_user_counts
    false
  end

  def enqueue_jobs
    false
  end
end
