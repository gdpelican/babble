require "spec_helper"

path = "./plugins/babble/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call

describe ::Babble::Topic do

  let(:user) { log_in }
  let(:another_user) { Fabricate :user }
  let(:group) { Fabricate :group }

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
  end

  describe "create_topic" do
    it "creates a topic" do
      Babble::Topic.create_topic "My new topic title", group
      t = Topic.last
      expect(t.user_id).to eq SiteSetting.babble_user_id
      expect(t.title).to eq "My new topic title"
      expect(t.custom_fields['group_id'].to_i).to eq group.id
      expect(t.visible).to eq false
    end

    it "does not a create a topic without a title" do
      expect { Babble::Topic.create_topic nil, group }.not_to change { Topic.count }
    end

    it "does not create a topic if no group is provided" do
      expect { Babble::Topic.create_topic "my new topic title", nil }.not_to change { Topic.count }
    end
  end
end
