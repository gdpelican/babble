module Babble
  module Chats
    class Category < ::Babble::Chats::Base
      def transform_params
        category = ::Category.find(@params[:category_id])
        super.merge(
          allowed_groups: ::Group.none,
          category_id:    category.id,
          title:          category.name
        )
      end

      private

      def custom_validations_pass?
        super && @topic.category.present?
      end
    end
  end
end
