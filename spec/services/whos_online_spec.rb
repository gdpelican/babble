require './plugins/babble/spec/babble_helper'

describe Babble::WhosOnline do
  let(:topic) { Fabricate :topic }
  let(:whos_online) { Babble::WhosOnline.new(topic) }
  let(:user1) { Fabricate :user }
  let(:user2) { Fabricate :user }

  describe 'add' do
    it 'adds a user and returns the list of users' do
      expect(whos_online.add(user1)).to include user1
      expect(whos_online.add(user2)).to include user2
    end
  end

  describe 'remove' do
    it 'removes a user and returns the list of users' do
      whos_online.add(user1)
      whos_online.add(user2)
      expect(whos_online.remove(user1)).to_not include user1
      expect(whos_online.remove(user2)).to be_empty
    end
  end
end
