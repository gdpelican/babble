# name: babble
# about: Shoutbox plugin for Discourse
# version: 0.0.1
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble.css"

BABBLE_PLUGIN_NAME ||= "babble".freeze
BABBLE_TOPIC_ID ||= -1
BABBLE_TOPIC_TITLE ||= "Title for Babble Topic"

after_initialize do
  module ::Babble
    class Engine < ::Rails::Engine
      engine_name BABBLE_PLUGIN_NAME
      isolate_namespace Babble
    end
  end

  Babble::Engine.routes.draw do
    get "/topic" => "topic#show"
    post "/posts" => "posts#create"
  end

  Discourse::Application.routes.append do
    mount ::Babble::Engine, at: "/babble"
  end

  require_dependency "application_controller"
  class ::Babble::TopicController < ::ApplicationController
    requires_plugin BABBLE_PLUGIN_NAME
    before_filter :ensure_logged_in

    def show
      begin
        topic = Babble::Topic.ensure_existence
        TopicUser.find_or_create_by(user: current_user, topic: topic)
        @topic_view = TopicView.new(topic.id, current_user, post_number: topic.highest_post_number)
        render json: TopicViewSerializer.new(@topic_view, scope: Guardian.new(current_user), root: false).as_json
      rescue StandardError => e
        render_json_error e.message
      end
    end
  end

  class ::Babble::PostsController < ::ApplicationController
    requires_plugin BABBLE_PLUGIN_NAME
    before_filter :ensure_logged_in

    def create
      begin
        Babble::PostCreator.create(current_user, post_creator_params)
        head :ok
      rescue StandardError => e
        render_json_error e.message
      end
    end

    private

    def post_creator_params
      {
        raw:              params[:raw],
        skip_validations: true,
        auto_track:       false
      }
    end
  end

  class ::Babble::PostCreator < ::PostCreator

    def self.create(user, opts)
      Babble::PostCreator.new(user, opts).create
    end

    def valid?
      setup_post
      @topic = @post.topic = Babble::Topic.ensure_existence
    end

    def enqueue_jobs
      return "Stubbed for #{BABBLE_TOPIC_TITLE}"
    end

    def trigger_after_events(post)
      super
      MessageBus.publish "/babble", serialized_post.merge!(type: :created)
    end

    private

    def serialized_post
      ::PostSerializer.new(@post, scope: guardian, root: false).as_json
    end
  end

  class ::Babble::Topic
    def self.ensure_existence
      current_chat_topic ||
      Topic.create!(id: BABBLE_TOPIC_ID,
                    user: Discourse.system_user,
                    title: BABBLE_TOPIC_TITLE,
                    visible: false)
    end

    def self.current_chat_topic
      Topic.unscoped.find_by id: BABBLE_TOPIC_ID
    end

    def self.recreate
      current_chat_topic.destroy && ensure_existence
    end
  end

end
