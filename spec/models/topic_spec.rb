require "spec_helper"

path = "./plugins/babble/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call

describe ::Babble::Topic do

  let(:user) { Fabricate :user }
  let(:another_user) { Fabricate :user }
  let(:group) { Fabricate :group }
  let(:another_group) { Fabricate :group, name: 'another_group' }

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
  end

  describe "available_topics_for" do
    let! (:topic) { Babble::Topic.create_topic "A topic I should see!", group }
    let! (:another_topic) { Babble::Topic.create_topic "A topic I should not see!", another_group }

    before { group.users << user }

    it "retrieves a topic available to the user" do
      expect(Babble::Topic.available_topics_for(user)).to include topic
    end

    it "does not retrieve topics not available to the user" do
      expect(Babble::Topic.available_topics_for(user)).to_not include another_topic
    end
  end

  describe "create_topic" do
    it "creates a topic" do
      Babble::Topic.create_topic "My new topic title", group
      t = Topic.last
      expect(t.user_id).to eq SiteSetting.babble_user_id
      expect(t.title).to eq "My new topic title"
      expect(t.allowed_groups).to eq [group]
      expect(t.visible).to eq false
    end

    it "creates a topic with the default group if none is specified" do
      Babble::Topic.stubs(:default_allowed_groups).returns([group])
      Babble::Topic.create_topic "My new topic title"
      t = Topic.last
      expect(t.allowed_groups).to eq [group]
    end

    it "does not a create a topic without a title" do
      expect { Babble::Topic.create_topic nil, group }.not_to change { Topic.count }
    end
  end
end
