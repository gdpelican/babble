module Babble
  module Chats
    class Pm < ::Babble::Chats::Base
      def transform_params
        super.merge(
          id:             existing_pm&.id,
          title:          Digest::MD5.hexdigest(user_ids),
          allowed_groups: Array(allowed_group).presence,
          subtype:        ::TopicSubtype.user_to_user
        ).compact.except(:user_ids)
      end

      private

      def custom_validations_pass?
        super && !@topic.category && @topic.allowed_groups.any?
      end

      def allowed_group
        ::Group.new(
          name:             Digest::MD5.hexdigest(user_ids),
          custom_fields:    { user_ids: user_ids },
          visibility_level: 4
        ).tap { |g| g.save(validate: false) } unless existing_pm
      end

      def existing_pm
        Topic.babble.find_by(title: Digest::MD5.hexdigest(user_ids))
      end

      def user_ids
        @params[:user_ids].map(&:to_i).sort.to_s
      end
    end
  end
end
