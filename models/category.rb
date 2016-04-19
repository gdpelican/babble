class ::Babble::Category
  def self.instance
    Category.find_by(name: SiteSetting.babble_category_name) ||
    Category.new(    name: SiteSetting.babble_category_name,
                     slug: SiteSetting.babble_category_name,
                     user: Discourse.system_user).tap { |t| t.save(validate: false) }
  end
end
