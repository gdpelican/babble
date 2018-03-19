module Babble
  module Chats
    class Pm < ::Babble::Chats::Base
      def transform_params
        super.merge(
          id:             existing_pm&.id,
          allowed_groups: Array(allowed_group).presence,
          subtype:        ::TopicSubtype.babble_pm
        ).compact.except(:user_ids)
      end

      private

      def custom_validations_pass?
        super && !@topic.category && @topic.allowed_groups.any?
      end

      def allowed_group
        Group.new(
          name:          Digest::MD5.hexdigest(@params[:user_ids].sort),
          custom_fields: { user_ids: @params[:user_ids].sort }
        ) unless existing_pm
      end

      def existing_pm
        @existing_pm ||= Topic
          .where(archetype: Archetype.chat)
          .joins(:allowed_groups)
          .joins(:group_custom_fields)
          .find_by("group_custom_fields.user_ids": @params[:user_ids].sort)
      end
    end
  end
end
