class ::Topic
  module ForDigest
    def for_digest(user, since, opts=nil)
      super(user, since, opts).where('archetype <> ?', Archetype.chat)
    end
  end
  singleton_class.prepend ForDigest

  scope :babble, -> { where(archetype: Archetype.chat) }
end
