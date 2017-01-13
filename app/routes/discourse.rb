Discourse::Application.routes.append do
  mount ::Babble::Engine, at: "/babble", :as => "babble"
  get '/chat/:slug/:id' => 'babble/topics#show'
  get '/chat/:slug/:id/:near_post' => 'babble/topics#show'
  get '/t/chat/:slug/:id' => 'babble/topics#show'
  get '/t/chat/:slug/:id/:near_post' => 'babble/topics#show'
  namespace :admin, constraints: StaffConstraint.new do
    resources :chats, only: [:show, :index]
  end
end
