require './plugins/babble/spec/babble_helper'

describe ::Babble::PostsController do
  routes { ::Babble::Engine.routes }
  let(:user) { log_in }
  let!(:topic) { Babble::Topic.save_topic title: "test topic for babble", allowed_group_ids: [group.id] }
  let!(:another_topic) { Babble::Topic.save_topic title: "another test topic", allowed_group_ids: [another_group.id] }
  let!(:another_post) { topic.posts.create(raw: "I am another post", user: another_user) }
  let!(:topic_post) { topic.posts.create(raw: "I am a post", user: user)}
  let(:another_user) { Fabricate :user }
  let(:public_category) { Fabricate :category, name: "public" }
  let(:public_category_topic) { Babble::Topic.save_topic permissions: :category, title: "a public category topic", category_id: public_category.id }
  let(:private_category) { Fabricate :private_category, name: "private", group: group }
  let(:private_category_topic) { Babble::Topic.save_topic permissions: :category, title: "a category topic", category_id: private_category.id }

  let(:group) { Fabricate :group }
  let(:another_group) { Fabricate :group, name: 'group_name' }

  describe "create" do
    it "adds a new post to the chat topic" do
      group.users << user
      expect { xhr :post, :create, raw: "I am a test post", topic_id: topic.id }.to change { topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it "returns the raw value of the post" do
      group.users << user
      xhr :post, :create, raw: "I am a test post", topic_id: topic.id
      expect(JSON.parse(response.body)['raw']).to eq "I am a test post"
    end

    it "can add a short post to the chat topic" do
      group.users << user
      expect { xhr :post, :create, raw: "Hi!", topic_id: topic.id }.to change { topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it 'does not allow posts with no content to be made' do
      group.users << user
      expect { xhr :post, :create, topic_id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 422
    end

    it "cannot create a post in a topic the user does not have access to" do
      user
      expect { xhr :post, :create, raw: "I am a test post!", topic_id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 403
    end

    it "does not allow posts from users who are not logged in" do
      expect { xhr :post, :create, raw: "I am a test post", topic_id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 403
    end

    it "does not affect user's post count" do
      group.users << user
      expect { xhr :post, :create, raw: "I am a test post", topic_id: topic.id }.not_to change { user.post_count }
    end

    it "can create a post in a public category topic" do
      user
      expect { xhr :post, :create, raw: "I am a test post", topic_id: public_category_topic.id }.to change { public_category_topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it "can create a post in a category topic" do
      group.users << user
      expect { xhr :post, :create, raw: "I am a test post", topic_id: private_category_topic.id }.to change { private_category_topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it "enforces category permissions" do
      user
      expect { xhr :post, :create, raw: "I am a test post", topic_id: private_category_topic.id }.not_to change { private_category_topic.posts.count }
      expect(response.status).to eq 403
    end
  end

  describe "update" do
    let(:raw) { "Here is an updated post!" }

    it "updates an existing post" do
      group.users << user
      expect { xhr :post, :update, raw: raw, topic_id: topic.id, id: topic_post.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 200
      expect(topic_post.reload.raw).to eq raw
    end

    it "does not allow updates to posts the user can't edit" do
      group.users << user
      group.users << another_user
      xhr :post, :update, raw: raw, topic_id: topic.id, id: another_post.id
      expect(response.status).to eq 403
    end

    it "allows admins to update others' posts" do
      user.update(admin: true)
      group.users << user
      group.users << another_user
      xhr :post, :update, raw: raw, topic_id: topic.id, id: topic_post.id
      expect(response.status).to eq 200
      expect(topic_post.reload.raw).to eq raw
    end

    it "does not allow updates from users who are not logged in" do
      xhr :post, :update, raw: raw, topic_id: topic.id, id: topic_post.id
      expect(response.status).to eq 403
    end

    it "does not allow posts to be updated to no content" do
      group.users << user
      xhr :post, :update, raw: '', topic_id: topic.id, id: topic_post.id
      expect(response.status).to eq 422
    end

    it "ensures the post belongs to the topic" do
      another_group.users << user
      xhr :post, :update, raw: raw, topic_id: another_topic.id, id: topic_post.id
      expect(response.status).to eq 422
    end
  end

  describe "destroy" do
    let!(:target_post) { topic.posts.create(raw: "I am a post to delete", user: user) }

    it "deletes an existing post" do
      group.users << user
      expect { xhr :post, :destroy, topic_id: topic.id, id: target_post.id }.to_not change { topic.posts.count }
      expect(target_post.reload.user_deleted).to eq true
      expect(response.status).to eq 200
    end

    it "does not allow deleting of posts the user can't delete" do
      group.users << user
      group.users << another_user
      xhr :post, :destroy, topic_id: topic.id, id: another_post.id
      expect(response.status).to eq 403
    end

    it "allows admins to delete others' posts" do
      user.update(admin: true)
      group.users << user
      group.users << another_user
      expect { xhr :post, :destroy, topic_id: topic.id, id: target_post.id }.to change { topic.posts.count }.by(-1)
      expect(response.status).to eq 200
    end
  end
end
