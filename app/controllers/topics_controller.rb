class ::Babble::TopicsController < ::ApplicationController
  requires_plugin Babble::BABBLE_PLUGIN_NAME
  include ::Babble::Controller
  before_action :set_default_id, only: :default
  before_action :set_pm_id,      only: :pm
  before_action :ensure_logged_in, except: [:show, :index]

  def index
    respond_with Babble::Chat.available_topics_for(guardian, pm: false), serializer: BasicTopicSerializer
  end

  def show
    perform_fetch do
      TopicUser.find_or_create_by(user: current_user, topic: topic) if current_user
      respond_with topic, serializer: Babble::TopicSerializer
    end
  end
  alias :default :show
  alias :pm :show

  def create
    perform_update { @topic = Babble::Chat.save_topic(topic_params) }
  end

  def update
    perform_update { Babble::Chat.save_topic(topic_params, topic) }
  end

  def destroy
    if !current_user.admin?
      respond_with_forbidden
    else
      Babble::Chat.destroy_topic(topic, current_user)
      respond_with nil
    end
  end

  def read
    perform_fetch do
      topic_user.update(last_read_post_number: params[:post_number]) if topic_user.last_read_post_number.to_i < params[:post_number].to_i
      respond_with topic, serializer: Babble::TopicSerializer
    end
  end

  def groups
    perform_fetch(require_admin: true) { respond_with topic.allowed_groups, serializer: BasicGroupSerializer }
  end

  def online
    perform_fetch do
      Babble::Broadcaster.publish_to_online(topic, current_user)
      respond_with nil
    end
  end

  def typing
    perform_fetch do
      Babble::Broadcaster.publish_to_typing(topic, current_user)
      respond_with nil
    end
  end

  private

  def topic
    @topic ||= ::Topic.babble.find_by(id: params[:id])
  end

  def set_default_id
    params[:id] = Babble::Chat.available_topics_for(guardian, pm: false).first&.id
  end

  def set_pm_id
    params[:id] = Babble::Chat.save_topic(
      permissions: :pm,
      user_ids: [current_user.id, params[:user_id]]
    ).id
  end

  def topic_params
    params.require(:topic).permit(:title, :permissions, :category_id, allowed_group_ids: [])
  end
end
