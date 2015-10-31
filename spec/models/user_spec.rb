require "spec_helper"

path = "./plugins/babble/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call

describe ::Babble::User do

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
  end

  describe 'instance' do
    it 'creates a new babble user if one does not exist' do
      expect { @user = Babble::User.instance }.to change { User.count }.by(1)
      expect(@user).to eq User.find(SiteSetting.babble_user_id)
      expect(@user.email).to eq SiteSetting.babble_user_email
      expect(@user.username).to eq SiteSetting.babble_username
      expect(@user.admin).to eq true
    end

    it 'returns the existing babble user if one exists' do
      user = Babble::User.instance
      expect { Babble::User.instance }.not_to change { User.count }
      expect(Babble::User.instance).to eq user
    end

    it 'ensures that the babble user is an admin' do
      Babble::User.instance.update(admin: false)
      expect(Babble::User.instance.admin).to eq true
    end
  end

end
