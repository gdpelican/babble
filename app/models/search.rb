class Search
  module FilterChats
    def execute
      super.tap { @results.posts.reject! { |p| p.archetype == Archetype.chat } }
    end
  end
  prepend FilterChats
end
