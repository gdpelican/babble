SiteSerializer.class_eval do
  module HideChatGroups
    def groups
      cache_fragment("group_names") do
        Group.where.not(visibility_level: ::Group::BABBLE_VISIBLITY_LEVEL)
             .order(:name)
             .pluck(:id, :name)
             .map { |id, name| { id: id, name: name } }
             .as_json
      end
    end
  end
  prepend HideChatGroups
end
