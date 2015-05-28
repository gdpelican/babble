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
        Babble::Topic.ensure_existence
        @topic = TopicView.new(BABBLE_TOPIC_ID, current_user)
        render json: TopicViewSerializer.new(@topic, scope: Guardian.new(current_user), root: false).as_json
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
      @topic = @post.topic = Babble::Topic.ensure_existence
    end

    def guardian
      Guardian.new(Discourse.system_user)
    end
  end

  class ::Babble::Topic
    def self.ensure_existence
      current_chat_topic ||
      Topic.create!(id: BABBLE_TOPIC_ID, 
                    user: Discourse.system_user,
                    title: BABBLE_TOPIC_TITLE,
                    deleted_at: Time.now)
    end

    def self.current_chat_topic
      Topic.unscoped.find_by id: BABBLE_TOPIC_ID
    end

    def self.recreate
      current_chat_topic.destroy && ensure_existence
    end
  end

end
