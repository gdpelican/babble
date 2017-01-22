class ::Babble::PostRevisor < ::PostRevisor

  def revise!(editor, fields, opts={})
    return false unless fields[:raw].present? && @post.topic == @topic
    opts[:validate_post] = false # don't validate length etc of chat posts
    super
  end

  private

  def publish_changes
    super
    Babble::Broadcaster.publish_to_posts(@post, @editor, is_edit: true)
  end
end
