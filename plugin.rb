# name: babble
# about: Shoutbox plugin for Discourse
# version: 1.0.0
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
    get    "/topics"                       => "topics#index"
    post   "/topics"                       => "topics#create"
    get    "/topics/default"               => "topics#default"
    get    "/topics/:id"                   => "topics#show"
    post   "/topics/:id"                   => "topics#update"
    delete "/topics/:id"                   => "topics#destroy"
    get    "/topics/:id/read/:post_number" => "topics#read"
    post   "/topics/:id/post"              => "topics#create_post"
    post   "/topics/:id/post/:post_id"     => "topics#update_post"
    delete "/topics/:id/destroy/:post_id"  => "topics#destroy_post"
    get    "/topics/:id/groups"            => "topics#groups"
    post   "/topics/:id/notification"      => "topics#send_notification"
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
          success_callback
          respond_with @post, serializer: Babble::PostSerializer
        else
          respond_with_unprocessable
        end
      end
    end

    def success_callback
      if (SiteSetting.babble_remote_post)
        RestClient.post(SiteSetting.babble_remote_url, { current_user: current_user.username, message: @post.cooked }) unless params[:skip_callback]
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

    def send_notification
      perform_fetch do
        Babble::Broadcaster.publish_to_notifications(topic, current_user, notification_params)
        respond_with nil
      end
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

    def notification_params
      params.require(:state)
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

    def update_user_counts
      return false
    end

    def enqueue_jobs
      return false
    end

    def trigger_after_events(post)
      super

      TopicUser.update_last_read(@user, @topic.id, @post.post_number, PostTiming::MAX_READ_TIME_PER_BATCH)
      Babble::Topic.prune_topic(@topic)

      Babble::Broadcaster.publish_to_posts(@post, @user)
      Babble::Broadcaster.publish_to_topic(@topic, @user)
    end
  end

  class ::Babble::PostRevisor < ::PostRevisor

    def revise!(editor, fields, opts={})
      opts[:validate_post] = false # don't validate length etc of chat posts
      super
    end

    private

    def publish_changes
      super
      Babble::Broadcaster.publish_to_posts(@post, @editor, is_edit: true)
    end
  end

  class ::Babble::PostDestroyer < ::PostDestroyer
    def destroy
      super
      Babble::Broadcaster.publish_to_topic(@topic, @user)
      Babble::Broadcaster.publish_to_posts(@post, @user, is_delete: true)
    end
  end

  class Babble::Broadcaster

    def self.publish_to_topic(topic, user, extras = {})
      MessageBus.publish "/babble/topics/#{topic.id}", serialized_topic(topic, user, extras)
    end

    def self.publish_to_posts(post, user, extras = {})
      MessageBus.publish "/babble/topics/#{post.topic_id}/posts", serialized_post(post, user, extras)
    end

    def self.publish_to_notifications(topic, user, status)
      MessageBus.publish "/babble/topics/#{topic.id}/notifications", serialized_notification(user, {status: status})
    end

    def self.serialized_topic(topic, user, extras = {})
      serialize(Babble::AnonymousTopicView.new(topic.id, user), user, extras, Babble::TopicViewSerializer)
    end

    def self.serialized_post(post, user, extras = {})
      serialize(post, user, extras, Babble::PostSerializer).as_json.merge(extras)
    end

    def self.serialized_notification(user, extras = {})
      UserSerializer.new(user, scope: Guardian.new).as_json.merge(extras)
    end

    def self.serialize(obj, user, extras, serializer)
      serializer.new(obj, scope: Guardian.new(user), root: false).as_json.merge(extras)
    end
  end

  class ::Babble::Topic

    def self.create_topic(params)
      return false unless params[:title].present?
      save_topic Topic.new, {
        user: Discourse.system_user,
        category: Babble::Category.instance,
        title: params[:title],
        visible: false,
        allowed_groups: get_allowed_groups(params[:allowed_group_ids])
      }
    end

    def self.update_topic(topic, params)
      return false unless params[:title].present?
      save_topic topic, {
        title: params[:title],
        allowed_groups: get_allowed_groups(params[:allowed_group_ids])
      }
    end

    def self.save_topic(topic, params)
      topic.tap do |t|
        t.assign_attributes(params)
        t.save(validate: false) if t.valid? || t.errors.to_hash.except(:title).empty?
      end
    end
    private_class_method :save_topic

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
      topic.update(user: Discourse.system_user)
    end

    def self.default_topic_for(user)
      available_topics_for(user).first
    end

    def self.available_topics
      Babble::Category.instance.topics.includes(:allowed_groups)
    end

    def self.available_topics_for(user)
      available_topics.joins(:allowed_group_users).where("? OR group_users.user_id = ?", user.admin, user.id).uniq
    end

    # NB: the set_default_allowed_groups block is passed for backwards compatibility,
    # so that we never have a topic which has no allowed groups.
    def self.find(id)
      available_topics.find_by(id: id).tap { |topic| set_default_allowed_groups(topic) if topic }
    end
  end

  # anonymous topic_view for sending out via Message Bus
  # (otherwise we end up serializing out the current user's read data to other people)
  class ::Babble::AnonymousTopicView < ::TopicView
    def topic_user
      nil
    end
  end

  class ::Babble::PostSerializer < ::PostSerializer
    attributes :image_count

    def initialize(object, opts = {})
      super object, opts.merge(add_raw: true)
    end
  end

  class ::Babble::TopicViewSerializer < ::TopicViewSerializer
    attributes :group_names, :last_posted_at
    def group_names
      object.topic.allowed_groups.pluck(:name).map(&:humanize)
    end

    def posts
      @posts ||= object.posts.map do |p|
        ps = Babble::PostSerializer.new(p, scope: scope, root: false)
        ps.topic_view = object
        ps.as_json
      end
    end

    def last_read_post_number
      super || 0
    end

    # details are expensive to calculate and we don't use them
    def include_details?
      false
    end
  end

  class ::Babble::Category
    def self.instance
      Category.find_by(name: SiteSetting.babble_category_name) ||
      Category.new(    name: SiteSetting.babble_category_name,
                       slug: SiteSetting.babble_category_name,
                       user: Discourse.system_user).tap { |t| t.save(validate: false) }
    end
  end

  class ::Guardian
    def can_see_topic?(topic)
      super && (is_admin? ||
               !Babble::Topic.available_topics.include?(topic) ||
                Babble::Topic.available_topics_for(user).include?(topic))
    end
  end

end
