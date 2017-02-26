require './plugins/babble/spec/babble_helper'

describe PostStreamWindow do
  describe 'for' do
    let!(:topic) { Fabricate :topic }
    let!(:post1) { Fabricate :post, topic: topic, post_number: 1 }
    let!(:post2) { Fabricate :post, topic: topic, post_number: 2 }
    let!(:post3) { Fabricate :post, topic: topic, post_number: 3 }

    before do
      Topic.reset_highest(topic.id)
      topic.reload
    end

    it 'returns a list of posts associated with a topic' do
      post_ids = PostStreamWindow.for(topic: topic).pluck(:id)
      expect(post_ids).to include post1.id
      expect(post_ids).to include post2.id
      expect(post_ids).to include post3.id
    end

    it 'returns posts in descending post number order by default' do
      post_ids = PostStreamWindow.for(topic: topic, limit: 1).pluck(:id)
      expect(post_ids).to_not include post1.id
      expect(post_ids).to_not include post2.id
      expect(post_ids).to include post3.id
    end

    it 'can return posts in ascending order' do
      post_ids = PostStreamWindow.for(topic: topic, order: :asc, limit: 1).pluck(:id)
      expect(post_ids).to_not include post1.id
      expect(post_ids).to_not include post2.id
      expect(post_ids).to include post3.id
    end

    it 'can return posts from a specified post number' do
      post_ids = PostStreamWindow.for(topic: topic, from: 2).pluck(:id)
      expect(post_ids).to include post1.id
      expect(post_ids).to include post2.id
      expect(post_ids).to_not include post3.id
    end

    it 'can return posts from a specified post number in ascending order' do
      post_ids = PostStreamWindow.for(topic: topic, from: 2, order: :asc).pluck(:id)
      expect(post_ids).to_not include post1.id
      expect(post_ids).to include post2.id
      expect(post_ids).to include post3.id
    end
  end
end
