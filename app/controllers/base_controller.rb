module ::Babble::BaseController
  private

  def topic_user
    @topic_user ||= TopicUser.find_or_initialize_by(user: current_user, topic: topic)
  end

  def perform_fetch(require_admin: false)
    if topic.blank?
      respond_with_not_found
    elsif ((require_admin && !current_user.admin) || !Babble::Topic.available_topics_for(guardian).include?(topic))
      respond_with_forbidden
    else
      yield
    end
  end

  def perform_update
    if !current_user.admin?
      respond_with_forbidden
    elsif !yield
      respond_with_unprocessable
    else
      respond_with topic, serializer: Babble::TopicSerializer
    end
  end

  def respond_with(object, serializer: nil, extras: {})
    case object
    when Array, ActiveRecord::Relation
      render json: ActiveModel::ArraySerializer.new(object, each_serializer: serializer, scope: guardian, params: params, root: false).as_json
    when nil
      render json: { success: :ok }
    else
      render json: serializer.new(object, scope: guardian, params: params, root: false).as_json.merge(extras)
    end
  end

  def respond_with_unprocessable
    render json: { errors: 'Unable to create or update post' }, status: :unprocessable_entity
  end

  def respond_with_forbidden
    render json: { errors: 'You are unable to view this chat topic' }, status: :forbidden
  end

  def respond_with_not_found
    render json: { errors: 'Chat topic not found' }, status: :not_found
  end
end
