# name: babble
# about: Shoutbox plugin for Discourse
# version: 0.14.3
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
  end

  Discourse::Application.routes.append do
    mount ::Babble::Engine, at: "/babble"
    namespace :admin, constraints: StaffConstraint.new do
      resources :chats, only: [:show, :index]
    end
  end

  Dir.chdir([:plugins, BABBLE_PLUGIN_NAME].join('/')) do
    require_relative 'controllers/topics_controller.rb'
    require_relative 'controllers/admin_chats_controller.rb'
    require_relative 'lib/broadcaster.rb'
    require_relative 'lib/post_creator.rb'
    require_relative 'lib/post_destroyer.rb'
    require_relative 'lib/post_revisor.rb'
    require_relative 'models/anonymous_topic_view.rb'
    require_relative 'models/category.rb'
    require_relative 'models/topic.rb'
    require_relative 'serializers/topic_view_serializer.rb'
    require_relative 'serializers/post_serializer'
  end

  class ::Guardian
    def can_see_topic?(topic)
      super && (is_admin? ||
               !Babble::Topic.available_topics.include?(topic) ||
                Babble::Topic.available_topics_for(user).include?(topic))
    end
  end

end
