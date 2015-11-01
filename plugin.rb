# name: babble
# about: Shoutbox plugin for Discourse
# version: 0.8.1
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble.scss"

BABBLE_PLUGIN_NAME ||= "babble".freeze

enabled_site_setting :babble_enabled

after_initialize do
  module ::Babble
    class Engine < ::Rails::Engine
      engine_name BABBLE_PLUGIN_NAME
      isolate_namespace Babble
    end
  end

  Babble::Engine.routes.draw do
    get  "/topics"                       => "topics#index"
    post "/topics"                       => "topics#create"
    get  "/topics/default"               => "topics#default"
    get  "/topics/:id"                   => "topics#show"
    post "/topics/:id"                   => "topics#update"
    delete "/topics/:id"                 => "topics#destroy"
    get  "/topics/:id/read/:post_number" => "topics#read"
    post "/topics/:id/post"              => "topics#post"
    get  "/topics/:id/groups"            => "topics#groups"
  end

  Discourse::Application.routes.append do
    mount ::Babble::Engine, at: "/babble"
    namespace :admin, constraints: StaffConstraint.new do
      resources :chats, only: [:show, :index]
    end
  end

  require_dependency "application_controller"
  class ::Babble::TopicsController < ::ApplicationController
    requires_plugin BABBLE_PLUGIN_NAME
    before_filter :ensure_logged_in
    before_filter :set_default_id, only: :default

    rescue_from('StandardError') { |e| render_json_error e.message, status: 422 }

    def index
      if current_user.blank?
        respond_with_forbidden
      else
        respond_with Babble::Topic.available_topics_for(current_user), serializer: Babble::BasicTopicSerializer
      end
    end

    def show
      perform_fetch do
        TopicUser.find_or_create_by(user: current_user, topic: topic)
        respond_with topic_view, serializer: TopicViewSerializer
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
        PostDestroyer.new(current_user, topic.ordered_posts.first).destroy
        respond_with nil
      else
        topic.destroy
        respond_with nil
      end
    end

    def read
      perform_fetch do
        TopicUser.update_last_read(current_user, topic.id, params[:post_number].to_i, PostTiming::MAX_READ_TIME_PER_BATCH)
        respond_with topic_view, serializer: TopicViewSerializer
      end
    end

    def post
      perform_fetch do
        post = create_post
        if post.persisted?
          respond_with post, serializer: PostSerializer
        else
          respond_with_unprocessable
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
        respond_with topic_view, serializer: TopicViewSerializer
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
      render json: { errors: 'Unable to create post' }, status: :unprocessable_entity
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

    def create_post
      Babble::PostCreator.create(current_user, post_creator_params)
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

  class ::Admin::ChatsController < ::ApplicationController
    requires_plugin BABBLE_PLUGIN_NAME
    define_method :index, ->{}
    define_method :show, ->{}
  end

  class ::Babble::PostCreator < ::PostCreator

    def self.create(user, opts)
      Babble::PostCreator.new(user, opts).create
    end

    def valid?
      setup_post
      @post.raw.present?
    end

    def setup_post
      super
      @topic = @post.topic = Topic.find_by(id: @opts[:topic_id])
    end

    def enqueue_jobs
      return false
    end

    def trigger_after_events(post)
      super

      TopicUser.update_last_read(@user, @topic.id, @post.post_number, PostTiming::MAX_READ_TIME_PER_BATCH)
      Babble::Topic.prune_topic(@topic)

      MessageBus.publish "/babble/topics/#{@topic.id}", serialized_topic
      MessageBus.publish "/babble/topics/#{@topic.id}/posts", serialized_post
    end

    private

    def serialized_topic
      TopicViewSerializer.new(TopicView.new(@topic.id), scope: Guardian.new(@user), root: false).as_json
    end

    def serialized_post
      PostSerializer.new(@post, scope: guardian, root: false).as_json
    end
  end

  class ::Babble::User
    def self.instance
      User.find_by(id:       SiteSetting.babble_user_id).tap { |user| ensure_admin(user) } ||
      User.create( id:       SiteSetting.babble_user_id,
                   email:    SiteSetting.babble_user_email,
                   username: SiteSetting.babble_username,
                   admin:    true).tap { use_gravatar }
    end

    def self.ensure_admin(user)
      user.update(admin: true) if user && user.id == SiteSetting.babble_user_id
    end

    def self.use_gravatar
      return if Rails.env.test?
      user = instance
      user.user_avatar.update_gravatar! &&
      user.update(uploaded_avatar: user.user_avatar.gravatar_upload)
    end
  end

  class ::Babble::Topic

    def self.create_topic(params)
      return false unless params[:title]
      Topic.create user: Babble::User.instance,
                   category: Babble::Category.instance,
                   title: params[:title],
                   visible: false,
                   allowed_groups: get_allowed_groups(params[:allowed_group_ids])
    end

    def self.update_topic(topic, params)
      topic.update title: params[:title],
                   allowed_groups: get_allowed_groups(params[:allowed_group_ids])
    end

    def self.get_allowed_groups(ids)
      Group.where(id: Array(ids)).presence || default_allowed_groups
    end

    def self.set_default_allowed_groups(topic)
      topic.allowed_group_ids << default_allowed_groups unless topic.allowed_groups.any?
    end

    def self.default_allowed_groups
      Group.find Array Group::AUTO_GROUPS[:trust_level_0]
    end

    def self.prune_topic(topic)
      topic.posts.order(created_at: :desc).offset(SiteSetting.babble_max_topic_size).destroy_all
    end

    def self.default_topic_for(user)
      available_topics_for(user).first
    end

    def self.available_topics
      Babble::User.instance.topics.includes(:allowed_groups)
    end

    def self.available_topics_for(user)
      available_topics.select { |topic| user.admin || topic.allowed_group_users.include?(user) }
    end

    # NB: the set_default_allowed_groups block is passed for backwards compatibility,
    # so that we never have a topic which has no allowed groups.
    def self.find(id)
      available_topics.find_by(id: id).tap { |topic| set_default_allowed_groups(topic) if topic }
    end
  end

  class ::Babble::BasicTopicSerializer < ::BasicTopicSerializer
    attributes :group_names, :last_posted_at
    def group_names
      object.allowed_groups.pluck(:name).map(&:humanize)
    end
  end

  class ::Babble::Category
    def self.instance
      Category.find_by(name:  SiteSetting.babble_category_name) ||
      Category.create!(name:  SiteSetting.babble_category_name,
                       user:  Babble::User.instance)
    end
  end

end
