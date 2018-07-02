class ::Babble::NotificationSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :topic_id, :post_number
end
