# name: babble
# about: Shoutbox plugin for Discourse
# version: 0.4.0
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble.css"

BABBLE_PLUGIN_NAME ||= "babble".freeze

after_initialize do
  module ::Babble
    class Engine < ::Rails::Engine
      engine_name BABBLE_PLUGIN_NAME
      isolate_namespace Babble
    end
  end

  Babble::Engine.routes.draw do
    get  "/topic"                   => "topics#show"
    get  "/topic/read/:post_number" => "topics#read"
    post "/topic/post"              => "topics#post"
  end

  Discourse::Application.routes.append do
    mount ::Babble::Engine, at: "/babble"
  end

  require_dependency "application_controller"
  class ::Babble::TopicsController < ::ApplicationController
    requires_plugin BABBLE_PLUGIN_NAME
    before_filter :ensure_logged_in

    rescue_from 'StandardError' do |e| render_json_error e.message end

    def show
      if topic
        TopicUser.find_or_create_by(user: current_user, topic: topic)
        respond_with_topic_view
      else
        render json: { errors: 'No chat topics are available!' }
      end
    end

    def read
      # TODO: This is way easier if we don't have to hack the post read timing
      # system to work for it. I'm not opposed to putting it back in, but just
      # setting it to the max value for now.
      TopicUser.update_last_read(current_user, topic.id, params[:post_number].to_i, PostTiming::MAX_READ_TIME_PER_BATCH)
      respond_with_topic_view
    end

    def post
      Babble::PostCreator.create(current_user, post_creator_params)
      respond_with_topic_view
    end

    private

    def respond_with_topic_view
      render json: TopicViewSerializer.new(topic_view, scope: Guardian.new(current_user), root: false).as_json
    end

    # should be able to replace this with Babble::Topic.find(id) of some kind
    # once we make to move to multiple chat channels
    def topic
      @topic ||= Babble::Topic.default_topic
    end

    def topic_view
      opts = { post_number: topic.highest_post_number } if topic.highest_post_number > 0
      @topic_view ||= TopicView.new(topic.id, current_user, opts || {})
    end

    def post_creator_params
      {
        raw:              params[:raw],
        skip_validations: true
      }
    end
  end

  class ::Babble::PostCreator < ::PostCreator

    def self.create(user, opts)
      Babble::PostCreator.new(user, opts).create
    end

    def valid?
      setup_post
      @topic = @post.topic = Babble::Topic.default_topic
    end

    def enqueue_jobs
      return false
    end

    def trigger_after_events(post)
      super

      TopicUser.update_last_read(@user, @topic.id, @post.post_number, PostTiming::MAX_READ_TIME_PER_BATCH)

      MessageBus.publish "/babble/topic", serialized_topic
      MessageBus.publish "/babble/post", serialized_post
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
    def self.find_or_create
      User.find_by(id:       SiteSetting.babble_user_id) ||
      User.create( id:       SiteSetting.babble_user_id,
                   email:    SiteSetting.babble_user_email,
                   username: SiteSetting.babble_username)
    end
  end

  class ::Babble::Topic

    def self.create_topic(title)
      Topic.create! user: Babble::User.find_or_create,
                    title: title,
                    visible: false
    end

    def self.default_topic
      available_topics.first
    end

    def self.available_topics
      Babble::User.find_or_create.topics
    end

  end

end
