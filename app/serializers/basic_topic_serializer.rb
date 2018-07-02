class Babble::BasicTopicSerializer < ::BasicTopicSerializer
  attributes :last_read_post_number, :highest_post_number, :category_id
end
