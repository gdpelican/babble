class Babble::BootSerializer < ActiveModel::Serializer
  has_many :topics,        serializer: Babble::BasicTopicSerializer
  has_many :notifications, serializer: Babble::NotificationSerializer
  has_many :users,         serializer: Babble::UserSerializer
end
