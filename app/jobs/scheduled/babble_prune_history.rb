module Jobs
  class BabblePruneHistory < Jobs::Scheduled
    every 1.days

    def execute(args)
      return unless SiteSetting.babble_history_window > 0 && posts_to_prune.any?
      posts_to_prune.update_all(hidden: true)
      Topic.where(id: posts_to_prune.pluck(:topic_id)).distinct.each do |t|
        topic.custom_fields[:lowest_post_number] = topic.posts.where(hidden: false).minimum(:post_number)
        topic.save(validate: false)
      end
    end

    def posts_to_prune
      @posts_to_prune ||= Post.joins(:topic)
        .where(hidden: false)
        .where("topics.archetype": Archetype.chat)
        .where('created_at < ?', SiteSetting.babble_history_window.days.ago)
    end
  end
end
