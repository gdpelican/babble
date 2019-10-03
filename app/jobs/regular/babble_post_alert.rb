module Jobs
  class BabblePostAlert < ::Jobs::Base
    def execute(args)
      return unless post = Post.find_by(id: args[:post_id])
      return unless post.topic&.archetype == Archetype.chat
      Babble::PostAlerter.new.after_save_post(post)
    end
  end
end
