class ::Babble::RootController < ::ApplicationController
  requires_plugin Babble::BABBLE_PLUGIN_NAME
  include ::Babble::Controller

  skip_before_action :check_xhr, only: :notification

  def boot
    respond_with Babble::Chat.boot_data_for(guardian), serializer: Babble::BootSerializer
  end

  def summary
    respond_with Babble::Chat.summary_for(guardian), serializer: Babble::SummarySerializer
  end

  def notification
    send_file Rails.root.join('plugins', 'babble', 'assets', 'sounds', 'notification.mp3'), type: 'audio/mp3'
  end
end
