# name: babble
# about: Shoutbox plugin for Discourse
# version: 0.0.1
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble.css"

PLUGIN_NAME ||= "babble".freeze
BABBLE_TOPIC_ID ||= -1
BABBLE_TOPIC_TITLE ||= "Title for Babble Topic"

after_initialize do
  module ::Babble
    class Engine < ::Rails::Engine
      engine_name PLUGIN_NAME
      isolate_namespace Babble
    end
  end

  Babble::Engine.routes.draw do
    get "/topic" => "topic#show"
    post "/post" => "post#create"
  end

  Discourse::Application.routes.append do
    mount ::Babble::Engine, at: "/babble"
  end

  require_dependency "application_controller"
  class ::Babble::TopicController < ::ApplicationController
    requires_plugin PLUGIN_NAME
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
    requires_plugin PLUGIN_NAME
    before_filter :ensure_logged_in

    def create
      @post = Babble::PostCreator.new(current_user, params[:post])
    end
  end

  class ::Babble::PostCreator < ::PostCreator
    def valid?
      @topic = Topic.unscoped.find_by id: BABBLE_TOPIC_ID
      setup_post
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
