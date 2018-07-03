class Babble::BasicTopicSerializer < ::BasicTopicSerializer
  attributes :last_read_post_number, :highest_post_number, :category_id, :permissions

  def permissions
    if object.subtype == TopicSubtype.user_to_user
      :pm
    elsif object.category_id
      :category
    else
      :group
    end
  end
end
