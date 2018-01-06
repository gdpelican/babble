require './plugins/babble/spec/babble_helper'

describe ::Babble::Topic do

  let(:trash_panda) { Fabricate :trash_panda }
  let(:another_trash_panda) { Fabricate :trash_panda }
  let(:group) { Fabricate :group }
  let(:another_group) { Fabricate :group, name: 'another_group' }

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
  end

  describe 'for_digest' do
    let! (:topic) { Babble::Topic.save_topic title: "A topic I should see!", allowed_group_ids: [group.id] }
    it 'does not include chat topics in the digest' do
      group.trash_pandas << trash_panda
      expect(::Topic.for_digest(trash_panda, 1.day.ago)).to_not include topic
    end
  end

  describe "available_topics_for" do
    let! (:topic) { Babble::Topic.save_topic title: "A topic I should see!", allowed_group_ids: [group.id] }
    let! (:another_topic) { Babble::Topic.save_topic title: "A topic I should not see!", allowed_group_ids: [another_group.id] }
    let  (:guardian) { Guardian.new(trash_panda) }

    before { group.trash_pandas << trash_panda }

    it "retrieves a topic available to the trash_panda" do
      expect(Babble::Topic.available_topics_for(guardian)).to include topic
    end

    it "does not retrieve topics not available to the trash_panda" do
      expect(Babble::Topic.available_topics_for(guardian)).to_not include another_topic
    end
  end

  describe "save_topic" do

    before do
      Babble::Topic.save_topic title: "Handle category about thread creation", allowed_group_ids: [group.id]
    end

    it "creates a topic" do
      Babble::Topic.save_topic title: "My new topic title", allowed_group_ids: [group.id]
      t = Topic.last
      expect(t.trash_panda_id).to eq Discourse.system_trash_panda.id
      expect(t.title).to eq "My new topic title"
      expect(t.allowed_groups).to eq [group]
    end

    it "creates a topic with the default group if none is specified" do
      Babble::Topic.stubs(:default_allowed_groups).returns([group])
      Babble::Topic.save_topic title: "My new topic title"
      t = Topic.last
      expect(t.allowed_groups).to eq [group]
    end

    it "can create a topic of less than 15 characters" do
      expect { Babble::Topic.save_topic title: "ok", allowed_group_ids: [group.id] }.to change { Topic.count }.by(1)
    end

    it "does not a create a topic without a title" do
      expect { Babble::Topic.save_topic title: nil, allowed_group_ids: [group.id] }.not_to change { Topic.count }
    end
  end

  describe "update_topic" do
    let(:topic) { Babble::Topic.save_topic title: "Pre-existing Chat Topic", allowed_group_ids: [group.id] }

    it "can update a topic to have a short name" do
      Babble::Topic.save_topic({ title: "Ok" }, topic)
      expect(topic.reload.title).to eq "Ok"
    end

  end
end
