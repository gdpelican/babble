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

      def save!
        if topic = super
          ::Category.find(topic.category_id).tap { |c| c.custom_fields['chat_topic_id'] = topic.id }.save
        end
        topic
      end

      private

      def custom_validations_pass?
        super && @topic.category && @topic.category.custom_fields['chat_topic_id'] == @topic.id
      end
    end
  end
end
