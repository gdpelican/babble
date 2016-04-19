class ::Babble::PostDestroyer < ::PostDestroyer
  def destroy
    super
    Babble::Broadcaster.publish_to_topic(@topic, @user)
    Babble::Broadcaster.publish_to_posts(@post, @user, is_delete: true)
  end
end
