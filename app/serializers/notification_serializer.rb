class ::Babble::NotificationSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :topic_id, :post_number, :sender_id

  def sender_id
    object.data_hash[:sender_id]
  end
end
