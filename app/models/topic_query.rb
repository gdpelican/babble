class ::TopicQuery
  module DefaultResults
    def default_results(options={})
      super(options).where('archetype <> ?', Archetype.chat)
    end
  end
  prepend DefaultResults
end
