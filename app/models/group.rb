class ::Group
  @@visible_group_scope = method(:visible_groups).clone
  scope :visible_groups, ->(user, order = nil) {
    @@visible_group_scope.call(user, order).where.not(visibility_level: 4)
  }
end
