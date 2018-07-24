class ::Notification
  @@visible_scope = method(:visible).clone
  scope :visible, -> { @@visible_scope.call.where('topics.archetype <> ?', Archetype.chat) }
  scope :babble, -> { joins(:topic).where("topics.archetype": Archetype.chat) }
end
