require_dependency "application_controller"
class ::Babble::TopicsController < ::ApplicationController
  before_filter :ensure_logged_in
  before_filter :set_default_id, only: :default

  rescue_from('StandardError') { |e| render_json_error e.message, status: 422 }

  def index
    if current_user.blank?
      respond_with_forbidden
    else
      respond_with Babble::Topic.available_topics_for(current_user), serializer: BasicTopicSerializer
    end
  end

  def show
    perform_fetch do
      TopicUser.find_or_create_by(user: current_user, topic: topic)
      respond_with topic_view, serializer: Babble::TopicViewSerializer
    end
  end
  alias :default :show

  def create
    perform_update { @topic = Babble::Topic.create_topic(topic_params) }
  end

  def update
    perform_update { Babble::Topic.update_topic(topic, topic_params) }
  end

  def destroy
    if !current_user.admin?
      respond_with_forbidden
    elsif topic.ordered_posts.any?
      Babble::PostDestroyer.new(current_user, topic.ordered_posts.first).destroy
      respond_with nil
    else
      topic.destroy
      respond_with nil
    end
  end

  def read
    perform_fetch do
      topic_user.update(last_read_post_number: params[:post_number]) if topic_user.last_read_post_number.to_i < params[:post_number].to_i
      respond_with topic_view, serializer: Babble::TopicViewSerializer
    end
  end

  def create_post
    perform_fetch do
      @post = Babble::PostCreator.create(current_user, post_creator_params)
      if @post.persisted?
        respond_with @post, serializer: Babble::PostSerializer
      else
        respond_with_unprocessable
      end
    end
  end

  def update_post
    perform_fetch do
      if !guardian.can_edit_post?(topic_post)
        respond_with_forbidden
      elsif params[:raw].present? && Babble::PostRevisor.new(topic_post, topic).revise!(current_user, params.slice(:raw))
        respond_with topic_post, serializer: Babble::PostSerializer
      else
        respond_with_unprocessable
      end
    end
  end

  def destroy_post
    perform_fetch do
      if !guardian.can_delete_post?(topic_post)
        respond_with_forbidden
      else
        Babble::PostDestroyer.new(current_user, topic_post).destroy
        respond_with topic_post, serializer: Babble::PostSerializer
      end
    end
  end

  def groups
    perform_fetch(require_admin: true) { respond_with topic.allowed_groups, serializer: BasicGroupSerializer }
  end

  private

  def set_default_id
    params[:id] = Babble::Topic.default_topic_for(current_user).try(:id)
  end

  def perform_fetch(require_admin: false)
    if topic.blank?
      respond_with_not_found
    elsif !current_user.admin && (require_admin || !Babble::Topic.available_topics_for(current_user).include?(topic))
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
      respond_with topic_view, serializer: Babble::TopicViewSerializer
    end
  end

  def respond_with(object, serializer: nil)
    case object
    when Array, ActiveRecord::Relation
      render json: ActiveModel::ArraySerializer.new(object, each_serializer: serializer, scope: guardian, root: false).as_json
    when nil
      render json: { success: :ok }
    else
      render json: serializer.new(object, scope: guardian, root: false).as_json
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

  def topic
    @topic ||= Babble::Topic.find(params[:id])
  end

  def topic_post
    @topic_post ||= topic.posts.find_by(id: params[:post_id])
  end

  def topic_user
    @topic_user ||= TopicUser.find_or_initialize_by(user: current_user, topic: topic)
  end

  def topic_view
    opts = { post_number: topic.highest_post_number } if topic.highest_post_number > 0
    @topic_view ||= TopicView.new(topic.id, current_user, opts || {})
  end

  def topic_params
    params.require(:topic).permit(:title, allowed_group_ids: [])
  end

  def post_creator_params
    {
      topic_id:         params[:id],
      raw:              params[:raw],
      skip_validations: true
    }
  end
end
