class ::Group
  default_scope { where.not(visibility_level: -1) }
end
