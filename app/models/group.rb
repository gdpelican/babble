class ::Group
  BABBLE_VISIBLITY_LEVEL = 999

  @@visible_group_scope = method(:visible_groups).clone
  scope :visible_groups, ->(user, order = nil, opts = {}) {
    @@visible_group_scope.call(user, order, opts).where.not(visibility_level: BABBLE_VISIBLITY_LEVEL)
  }
end
