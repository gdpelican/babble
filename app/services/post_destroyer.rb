class ::Babble::PostDestroyer < ::PostDestroyer
  def destroy
    super
    case @topic.subtype
    when TopicSubtype.user_to_user then handle_babble_pm
    else                                handle_babble_post
    end
  end

  def handle_babble_pm
    @topic.allowed_group_users.each do |user|
      Babble::Broadcaster.publish_to_notifications(user.notifications.build, @post, is_delete: true)
    end
  end

  def handle_babble_post
    Babble::Broadcaster.publish_to_topic(@topic, @user)
    Babble::Broadcaster.publish_to_posts(@post, @user, is_delete: true)
  end

  def update_user_counts
    # Don't update user counts on post destroyal
  end
end
