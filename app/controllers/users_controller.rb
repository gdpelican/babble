class ::Babble::UsersController < ::ApplicationController
  requires_plugin Babble::BABBLE_PLUGIN_NAME
  include ::Babble::Controller
  before_action :ensure_logged_in

  def index
    respond_with Babble::Chat.available_pms_for(guardian, limit: params[:limit])), serializer: Babble::UserSerializer
  end
end
