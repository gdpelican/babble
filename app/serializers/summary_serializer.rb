class Babble::SummarySerializer < ActiveModel::Serializer
  attributes :unread_count, :notification_count
end
