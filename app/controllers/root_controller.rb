class ::Babble::RootController < ::ApplicationController
  requires_plugin Babble::BABBLE_PLUGIN_NAME
  include ::Babble::Controller

  def boot
    respond_with Babble::Chat.boot_data_for(guardian), serializer: Babble::BootSerializer
  end

  def summary
    respond_with Babble::Chat.summary_for(guardian), serializer: Babble::SummarySerializer
  end
end
