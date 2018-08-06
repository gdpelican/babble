class ::Post
  @@public_posts_scope  = method(:public_posts).clone
  @@private_posts_scope = method(:private_posts).clone
  scope :public_posts,  -> { @@public_posts_scope.call.where("topics.archetype <> ?", Archetype.chat) }
  scope :private_posts, -> { @@private_posts_scope.call.where("topics.archetype <> ?", Archetype.chat) }
end
