# name: babble
# about: Shoutbox plugin for Discourse
# version: 0.0.1
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble_sidebar.css"

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

  class ::Babble::Controller < ActionController::Base
    def show
      format.json do
        render_json_dump(TopicViewSerializer.new(TopicView.new(Babble::Topic.find_or_create.id, system_guardian), 
                                                 scope: system_guardian,
                                                 root: false))
      end
    end

    private

    def system_guardian
      @system_guardian ||= Guardian.new Discourse.system_user
    end
  end

  class ::Babble::Topic
    def self.find_or_create
      Topic.unscoped.find_by(id: BABBLE_TOPIC_ID) ||
      Topic.create!(id: BABBLE_TOPIC_ID, 
                    user: Discourse.system_user,
                    title: BABBLE_TOPIC_TITLE,
                    deleted_at: Time.now)
    end
  end
end
