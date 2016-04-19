# anonymous topic_view for sending out via Message Bus
# (otherwise we end up serializing out the current user's read data to other people)
class ::Babble::AnonymousTopicView < ::TopicView
  def topic_user
    nil
  end
end
