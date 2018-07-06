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

  private

  def include_last_read_post_number?
    object.respond_to?(:last_read_post_number)
  end
end
