module Babble
  module Chats
    class Group < ::Babble::Chats::Base
      def transform_params
        super.merge(allowed_groups: allowed_groups)
      end

      private

      def custom_validations_pass?
        super && !@topic.category && @topic.allowed_groups.any?
      end

      def allowed_groups
        ::Group.where(id: @params[:allowed_group_ids]).presence ||
        ::Group.find(Array(::Group::AUTO_GROUPS[:trust_level_0]))
      end
    end
  end
end
