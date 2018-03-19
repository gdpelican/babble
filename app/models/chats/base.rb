module Babble
  module Chats
    class Base
      def initialize(params = {}, topic = nil)
        topic ||= ::Topic.new(archetype: ::Archetype.chat)
        raise "Must be chat topic!" unless topic.archetype == ::Archetype.chat
        @topic  = topic
        @params = params
      end

      def save!
        @topic.assign_attributes(transform_params)
        if custom_validations_pass?
          @topic.save(validate: false)
          @topic
        end
      end

      private

      # Override for specific topic types
      def custom_validations_pass?
        @topic.title.present?
      end

      def transform_params
        @params.merge(
          user_id:           Discourse::SYSTEM_USER_ID,
          last_post_user_id: Discourse::SYSTEM_USER_ID
        ).except(:permissions, :allowed_group_id, :user_ids)
      end
    end
  end
end
