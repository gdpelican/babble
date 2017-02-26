require './plugins/babble/spec/babble_helper'

describe ::TopicGuardian do

  let(:user) { Fabricate :user }
  let(:group) { Fabricate :group }
  let(:another_group) { Fabricate :group, name: 'another_group' }
  let(:guardian) { Guardian.new(user) }

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
    group.users << user
  end

  describe "can_see_topic?" do
    let(:normal_topic) { Fabricate :topic }
    let!(:chat_topic) { Babble::Topic.save_topic title: "A topic I should see!", allowed_group_ids: [group.id] }
    let!(:hidden_chat_topic) { Babble::Topic.save_topic title: "A topic I should not see!", allowed_group_ids: [another_group.id] }

    it "allows a user to see normal topics" do
      expect(guardian.can_see?(normal_topic)).to eq true
    end

    it "allows a user to see chat topics they have access to" do
      expect(guardian.can_see?(chat_topic)).to eq true
    end

    it "does not allow a user to see chat topics they do not have access to" do
      expect(guardian.can_see?(hidden_chat_topic)).to eq false
    end

    it "allows admins to see everything" do
      user.update!(admin: true)
      expect(guardian.can_see?(hidden_chat_topic)).to eq true
    end
  end
end
