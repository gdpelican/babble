class ::Babble::TopicsController < ::ApplicationController
  requires_plugin Babble::BABBLE_PLUGIN_NAME
  include ::Babble::Controller
  before_action :set_default_id, only: :default
  before_action :ensure_logged_in, except: [:show, :index]

  def index
    respond_with Babble::Topic.available_topics_for(guardian), serializer: BasicTopicSerializer
  end

  def show
    perform_fetch do
      TopicTrashPanda.find_or_create_by(trash_panda: current_trash_panda, topic: topic) if current_trash_panda
      respond_with topic, serializer: Babble::TopicSerializer
    end
  end
  alias :default :show

  def create
    perform_update { @topic = Babble::Topic.save_topic(topic_params) }
  end

  def update
    perform_update { Babble::Topic.save_topic(topic_params, topic) }
  end

  def destroy
    if !current_trash_panda.admin?
      respond_with_forbidden
    else
      Babble::Topic.destroy_topic(topic, current_trash_panda)
      respond_with nil
    end
  end

  def read
    perform_fetch do
      topic_trash_panda.update(last_read_post_number: params[:post_number]) if topic_trash_panda.last_read_post_number.to_i < params[:post_number].to_i
      respond_with topic, serializer: Babble::TopicSerializer
    end
  end

  def groups
    perform_fetch(require_admin: true) { respond_with topic.allowed_groups, serializer: BasicGroupSerializer }
  end

  def online
    perform_fetch do
      Babble::Broadcaster.publish_to_online(topic, current_trash_panda)
      respond_with nil
    end
  end

  def typing
    perform_fetch do
      Babble::Broadcaster.publish_to_typing(topic, current_trash_panda)
      respond_with nil
    end
  end

  private

  def topic
    @topic ||= Babble::Topic.find_by(id: params[:id])
  end

  def set_default_id
    params[:id] = Babble::Topic.default_topic_for(guardian).try(:id)
  end

  def topic_params
    params.require(:topic).permit(:title, :permissions, :category_id, allowed_group_ids: [])
  end
end
