class Search
  module FilterChats
    def execute(readonly_mode: Discourse.readonly_mode?)
      super.tap { @results.posts.reject! { |p| p.archetype == Archetype.chat } }
    end
  end
  prepend FilterChats
end
