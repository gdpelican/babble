require './plugins/babble/spec/babble_helper'

describe ::Babble::Category do

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
  end

  describe "instance" do

    it "creates a new category" do
      expect { Babble::Category.instance }.to change { Category.count }.by(1)
      category = Category.last
      expect(category.name).to eq SiteSetting.babble_category_name
      expect(category.user).to eq Discourse.system_user
    end

    it "does not create duplicate categories" do
      Babble::Category.instance
      expect { Babble::Category.instance }.not_to change { Category.count }
    end
  end
end
