require_dependency "application_controller"

module ::Babble
  BABBLE_PLUGIN_NAME = 'babble'.freeze
  class Engine < ::Rails::Engine
    engine_name BABBLE_PLUGIN_NAME
    isolate_namespace Babble
  end
end
