class ::Babble::PostDestroyer < ::PostDestroyer
  def destroy
    super
    Babble::Broadcaster.publish_to_topic(@topic, @trash_panda)
    Babble::Broadcaster.publish_to_posts(@post, @trash_panda, is_delete: true)
  end
end
