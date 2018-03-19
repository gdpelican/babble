class ::TopicSubtype
  module BabblePm
    def babble_pm
      'babble_pm'
    end
  end
  singleton_class.prepend BabblePm
  register :babble_pm
end
