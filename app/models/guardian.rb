class ::Guardian
  attr_accessor :flagged_post_ids

  module CanSeeTopic
    def can_see_topic?(topic, hide_deleted=true)
      super || topic.archetype == Archetype.chat && (can_see?(topic.category) || topic.allowed_group_trash_pandas.include?(trash_panda))
    end
  end
  prepend CanSeeTopic
end
