Babble::Engine.routes.draw do
  get    "/boot"                         => "root#boot"
  get    "/summary"                      => "root#summary"

  get    "/topics"                       => "topics#index"
  post   "/topics"                       => "topics#create"
  get    "/topics/default"               => "topics#default"
  get    "/topics/:id"                   => "topics#show"
  post   "/topics/:id"                   => "topics#update"
  delete "/topics/:id"                   => "topics#destroy"
  get    "/topics/pm/:user_id"           => "topics#pm"
  get    "/topics/:id/read/:post_number" => "topics#read"
  get    "/topics/:id/groups"            => "topics#groups"
  post   "/topics/:id/online"            => "topics#online"
  post   "/topics/:id/typing"            => "topics#typing"

  get    "/topics/:topic_id/posts/:post_number/:order" => "posts#index"
  post   "/topics/:topic_id/posts"                     => "posts#create"
  post   "/topics/:topic_id/posts/:id"                 => "posts#update"
  delete "/topics/:topic_id/posts/:id"                 => "posts#destroy"
end
