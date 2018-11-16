class ::Babble::PostRevisor < ::PostRevisor

  def revise!(editor, fields, opts={})
    return false unless fields[:raw].present? && @post.topic == @topic
    opts[:validate_post] = false # don't validate length etc of chat posts
    super
  end

  private

  def publish_changes
    super
    case @topic.subtype
    when TopicSubtype.user_to_user then handle_babble_pm
    else                                handle_babble_post
    end
  end

  def handle_babble_pm
    @topic.allowed_group_users.each do |user|
      Babble::Broadcaster.publish_to_notifications(user.notifications.build, @post, is_edit: true)
    end
  end

  def handle_babble_post
    Babble::Broadcaster.publish_to_posts(@post, @editor, is_edit: true)
  end
end
