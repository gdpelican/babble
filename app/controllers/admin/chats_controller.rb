class ::Admin::ChatsController < ::ApplicationController
  requires_plugin Babble::BABBLE_PLUGIN_NAME
  define_method :index, ->{}
  define_method :show, ->{}
end
