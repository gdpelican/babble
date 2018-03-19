module Babble
  module Chats
    class Pm < ::Babble::Chats::Base
      def transform_params
        super.merge(
          allowed_groups: allowed_groups,
          subtype:        ::TopicSubtype.babble_pm
        ).except(:user_ids)
      end

      private

      def custom_validations_pass?
        super && !@topic.category && @topic.allowed_groups.any?
      end

      def allowed_groups
        Array(@topic.allowed_groups.first || ::Group.new).tap do |group|
          group.assign_attributes(
            name:          Digest::MD5.hexdigest(@params[:user_ids]),
            custom_fields: { user_ids: @params[:user_ids] }
          )
        end
      end
    end
  end
end
