module Babble
  class Backfiller
    def self.backfill_visibility_level
      ::Group.joins("INNER JOIN topic_allowed_groups tag ON tag.group_id = groups.id")
             .joins("INNER JOIN topics ON tag.topic_id = topics.id")
             .where("topics.archetype": Archetype.chat, visibility_level: 4)
             .update_all(visibility_level: ::Group::BABBLE_VISIBLITY_LEVEL)

    end
  end
end
