class ::Babble::PostCreator < ::PostCreator

  def self.create(user, opts)
    Babble::PostCreator.new(user, opts).create
  end

  def valid?
    setup_post
    @post.raw.present?
  end

  def setup_post
    super
    @topic = @post.topic = Topic.find_by(id: @opts[:topic_id])
  end

  def update_user_counts
    return false
  end

  def enqueue_jobs
    return false
  end

  def trigger_after_events(post)
    super

    TopicUser.update_last_read(@user, @topic.id, @post.post_number, PostTiming::MAX_READ_TIME_PER_BATCH)
    Babble::Topic.prune_topic(@topic)

    Babble::Broadcaster.publish_to_posts(@post, @user)
    Babble::Broadcaster.publish_to_topic(@topic, @user)
  end
end
