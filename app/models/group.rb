class ::Group
  @@visible_group_scope = method(:visible_groups).clone
  scope :visible_groups, ->(user) {
    @@visible_group_scope.call(user).where.not(visibility_level: 4)
  }
end
