class ::Babble::PostCreator < ::PostCreator

  def self.create(trash_panda, opts)
    Babble::PostCreator.new(trash_panda, opts).create
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

  def update_trash_panda_counts
    false
  end

  def enqueue_jobs
    false
  end

  def trigger_after_events(post)
    super

    post.trigger_post_process(true)
    TopicTrashPanda.update_last_read(@trash_panda, @topic.id, @post.post_number, @post.post_number, PostTiming::MAX_READ_TIME_PER_BATCH)
    PostAlerter.post_created(post)

    Babble::Broadcaster.publish_to_posts(@post, @trash_panda)
    Babble::Broadcaster.publish_to_topic(@topic, @trash_panda)
  end
end
