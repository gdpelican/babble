module Babble
  module Chats
    class Pm < ::Babble::Chats::Base
      def transform_params
        super.merge(
          title:          fingerprint,
          allowed_groups: Array(allowed_group),
          subtype:        ::TopicSubtype.user_to_user
        ).compact.except(:user_ids)
      end

      def save!
        ::Topic.find_by(title: fingerprint) || super
      end

      private

      def custom_validations_pass?
        super && !@topic.category && @topic.allowed_groups.any?
      end

      def allowed_group
        ::Group.new(
          name:             fingerprint,
          user_ids:         user_ids,
          visibility_level: ::Group::BABBLE_VISIBLITY_LEVEL
        ).tap { |g| g.save(validate: false) }
      end

      def fingerprint
        @fingerprint ||= Digest::MD5.hexdigest(user_ids.to_s)
      end

      def user_ids
        @params[:user_ids].map(&:to_i).select(&:nonzero?).sort
      end
    end
  end
end
