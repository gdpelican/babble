Discourse::Application.routes.append do
  mount ::Babble::Engine, at: "/babble", :as => "babble"
  namespace :admin, constraints: StaffConstraint.new do
    resources :chats, only: [:show, :index]
  end
end
