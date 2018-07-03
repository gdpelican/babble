class ::Babble::PostAlerter < ::PostAlerter
  def after_save_post(post)
    return unless post.topic.archetype == Archetype.chat
    super(post, true)

    handle_babble_pm(post) if post.topic.subtype == TopicSubtype.user_to_user
    handle_babble_notifications(post)
  end

  private

  def handle_babble_pm(post)
    User.babble_pm_recipients_for(post).each do |user|
      user.notifications.create!(
        notification_type: Notification.types[:mentioned],
        topic_id:          post.topic_id,
        post_number:       post.post_number,
        data:              { sender_id: post.user_id }.to_json,
        skip_send_email:   true
      )
    end
  end

  def handle_babble_notifications(post)
    Babble::Broadcaster.publish_to_topic post.topic, post.user
    Babble::Broadcaster.publish_to_posts post, post.user
    Notification.babble.where(topic: post.topic, post_number: post.post_number).each do |notification|
      Babble::Broadcaster.publish_to_notifications(notification)
    end
  end
end
