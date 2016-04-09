require "rails_helper"

path = "./plugins/babble/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call

describe ::Babble::TopicsController do
  routes { ::Babble::Engine.routes }

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
  end

  let(:user) { log_in }
  let(:another_user) { Fabricate :user }
  let(:group) { Fabricate :group }
  let(:another_group) { Fabricate :group, name: 'group_name' }
  let!(:topic) { Babble::Topic.create_topic title: "test topic for babble", allowed_group_ids: [group.id] }
  let!(:topic_post) { topic.posts.create(raw: "I am a post", user: user)}
  let!(:another_post) { topic.posts.create(raw: "I am another post", user: another_user) }
  let!(:another_topic) { Babble::Topic.create_topic title: "another test topic", allowed_group_ids: [another_group.id] }
  let(:non_chat_topic) { Fabricate :topic }

  let(:chat_params) {{
    title: "This is a new topic title",
    allowed_group_ids: [allowed_group_a.id]
  }}
  let(:allowed_group_a) { Fabricate :group, name: 'group_a' }
  let(:allowed_group_b) { Fabricate :group, name: 'group_b' }

  describe "index" do
    before do
      group.users << user
    end

    it "returns a list of topics for the current user" do
      xhr :get, :index
      expect(response.status).to eq 200
      topic_ids = response_json['topics'].map { |t| t['id'] }
      topic_titles = response_json['topics'].map { |t| t['title'] }
      expect(topic_ids).to include topic.id
      expect(topic_ids).to_not include another_topic.id
      expect(topic_titles).to include topic.title
      expect(topic_titles).to_not include another_topic.title
    end
  end

  describe "show" do

    it "returns the default chat topic for a user if it exists" do
      group.users << user
      xhr :get, :show, id: topic.id
      expect(response.status).to eq 200
      expect(response_json['id']).to eq topic.id
    end

    it "returns the raw post content in the post stream" do
      group.users << user
      xhr :get, :show, id: topic.id
      posts_cooked = response_json['post_stream']['posts'].map { |p| p['cooked'] }
      posts_raw    = response_json['post_stream']['posts'].map { |p| p['raw'] }

      expect(posts_cooked).to include topic_post.cooked
      expect(posts_raw).to include topic_post.raw
    end

    it "returns a response with an error message if the topic does not exist" do
      group.users << user
      topic.destroy
      xhr :get, :show, id: topic.id
      expect(response.status).to eq 404
      expect(response_json['errors']).to be_present
    end

    it 'returns a response with an error message if the user cannot view the topic' do
      user
      xhr :get, :show, id: topic.id
      expect(response.status).to eq 403
      expect(response_json['errors']).to be_present
    end

    it "returns an error if the user is logged out" do
      xhr :get, :show, id: topic.id
      expect(response.status).to eq 403
      expect(response_json['errors']).to be_present
    end
  end

  describe "post" do
    it "adds a new post to the chat topic" do
      group.users << user
      expect { xhr :post, :create_post, raw: "I am a test post", id: topic.id }.to change { topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it "returns the raw value of the post" do
      group.users << user
      xhr :post, :create_post, raw: "I am a test post", id: topic.id
      expect(JSON.parse(response.body)['raw']).to eq "I am a test post"
    end

    it "can add a short post to the chat topic" do
      group.users << user
      expect { xhr :post, :create_post, raw: "Hi!", id: topic.id }.to change { topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it 'does not allow posts with no content to be made' do
      group.users << user
      expect { xhr :post, :create_post, id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 422
    end

    it "cannot create a post in a topic the user does not have access to" do
      user
      expect { xhr :post, :create_post, raw: "I am a test post!", id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 403
    end

    it "does not allow posts from users who are not logged in" do
      expect { xhr :post, :create_post, raw: "I am a test post", id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 403
    end

    it "does not affect user's post count" do
      group.users << user
      expect { xhr :post, :create_post, raw: "I am a test post", id: topic.id }.not_to change { user.post_count }
    end

    it "deletes old posts in a rolling window" do
      group.users << user
      group.users << another_user
      SiteSetting.babble_max_topic_size = 10

      xhr :post, :create_post, raw: "I am the original post", id: topic.id
      9.times { make_a_post(topic) }

      expect { xhr :post, :create_post, raw: "I've stepped over the post limit!", id: topic.id }.not_to change { topic.posts.count}
      expect(response.status).to eq 200

      post_contents = topic.posts.map(&:raw).uniq
      expect(post_contents).to include "I've stepped over the post limit!"
      expect(post_contents).to_not include "I am the original post"
    end
  end

  describe "flag_post" do
    
  end

  describe "destroy_post" do
    let!(:target_post) { topic.posts.create(raw: "I am a post to delete", user: user) }

    it "deletes an existing post" do
      group.users << user
      expect { xhr :post, :destroy_post, id: topic.id, post_id: target_post.id }.to_not change { topic.posts.count }
      expect(target_post.reload.user_deleted).to eq true
      expect(response.status).to eq 200
    end

    it "does not allow deleting of posts the user can't delete" do
      group.users << user
      group.users << another_user
      xhr :post, :destroy_post, id: topic.id, post_id: another_post.id
      expect(response.status).to eq 403
    end

    it "allows admins to delete others' posts" do
      user.update(admin: true)
      group.users << user
      group.users << another_user
      expect { xhr :post, :destroy_post, id: topic.id, post_id: target_post.id }.to change { topic.posts.count }.by(-1)
      expect(response.status).to eq 200
    end
  end

  describe "update_post" do
    let(:raw) { "Here is an updated post!" }

    it "updates an existing post" do
      group.users << user
      expect { xhr :post, :update_post, raw: raw, id: topic.id, post_id: topic_post.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 200
      expect(topic_post.reload.raw).to eq raw
    end

    it "does not allow updates to posts the user can't edit" do
      group.users << user
      group.users << another_user
      xhr :post, :update_post, raw: raw, id: topic.id, post_id: another_post.id
      expect(response.status).to eq 403
    end

    it "allows admins to update others' posts" do
      user.update(admin: true)
      group.users << user
      group.users << another_user
      xhr :post, :update_post, raw: raw, id: topic.id, post_id: topic_post.id
      expect(response.status).to eq 200
      expect(topic_post.reload.raw).to eq raw
    end

    it "does not allow updates from users who are not logged in" do
      xhr :post, :update_post, raw: raw, id: topic.id, post_id: topic_post.id
      expect(response.status).to eq 403
    end

    it "does not allow posts to be updated to no content" do
      group.users << user
      xhr :post, :update_post, raw: '', id: topic.id, post_id: topic_post.id
      expect(response.status).to eq 422
    end

    it "ensures the post belongs to the topic" do
      another_group.users << user
      xhr :post, :update_post, raw: raw, id: another_topic.id, post_id: topic_post.id
      expect(response.status).to eq 422
    end
  end

  describe "create" do
    before do
      user.update(admin: true)
    end

    it "creates a new chat topic" do
      xhr :post, :create, topic: chat_params
      expect(response).to be_success

      new_topic = Babble::Topic.available_topics.last
      expect(new_topic.user).to eq Discourse.system_user
      expect(new_topic.title).to eq chat_params[:title]
      expect(new_topic.allowed_groups.length).to eq 1
      expect(new_topic.allowed_groups).to include allowed_group_a
    end

    it "can create a chat topic with a short name" do
      chat_params[:title] = 'short'
      expect { xhr :post, :create, topic: chat_params }.to change { Topic.count }.by(1)
      expect(response).to be_success
    end

    it 'defaults to trust level 0 for a group' do
      chat_params[:allowed_group_ids] = []
      xhr :post, :create, topic: chat_params
      expect(response).to be_success

      new_topic = Babble::Topic.available_topics.last
      expect(new_topic.allowed_groups).to include Group.find Group::AUTO_GROUPS[:trust_level_0]
    end

    it "does not create an invalid chat topic" do
      chat_params[:title] = ''
      xhr :post, :create, topic: chat_params
      expect(response.status).to eq 422
      expect(Babble::Topic.available_topics.last.title).not_to eq chat_params[:title]
    end

    it 'does not allow non-admins to create topics' do
      user.update(admin: false)
      xhr :post, :create, topic: chat_params
      expect(response.status).to eq 403
      expect(Babble::Topic.available_topics.last.title).not_to eq chat_params[:title]
    end
  end

  describe 'update' do
    before do
      user.update(admin: true)
    end

    it "updates a chat topic" do
      xhr :post, :update, id: topic.id, topic: chat_params
      expect(response).to be_success

      topic.reload
      expect(topic.title).to eq chat_params[:title]
      expect(topic.allowed_group_ids).to eq chat_params[:allowed_group_ids]
    end

    it "can update a chat topic to a short title" do
      chat_params[:title] = "Ok"
      xhr :post, :update, id: topic.id, topic: chat_params
      expect(response).to be_success
      expect(topic.reload.title).to eq chat_params[:title]
    end

    it "does not make invalid updates" do
      chat_params[:title] = ''
      xhr :post, :update, id: topic.id, topic: chat_params
      expect(response.status).to eq 422
      expect(Babble::Topic.find(topic.id).title).to_not eq chat_params[:title]
    end

    it 'does not allow non-admins to update topics' do
      user.update(admin: false)
      xhr :post, :update, id: topic.id, topic: chat_params
      expect(response.status).to eq 403
      expect(Babble::Topic.find(topic.id).title).to_not eq chat_params[:title]
    end
  end

  describe "destroy" do
    before do
      user.update(admin: true)
      group.users << another_user
    end

    it "can destroy a chat topic" do
      xhr :delete, :destroy, id: topic.id
      expect(response).to be_success
      expect(Babble::Topic.available_topics).not_to include topic
    end

    it "can destroy a chat topic with posts" do
      make_a_post(topic)
      xhr :delete, :destroy, id: topic.id
      expect(response).to be_success
      expect(Babble::Topic.available_topics).not_to include topic
    end

    it "does not allow non-admins to destroy topics" do
      user.update(admin: false)
      xhr :delete, :destroy, id: topic.id
      expect(response.status).to eq 403
      expect(Babble::Topic.available_topics).to include topic
    end
  end

  describe "read" do
    it "reads a post up to the given post number" do
      group.users << user
      group.users << another_user
      5.times { make_a_post(topic) }
      TopicUser.find_or_create_by(user: user, topic: topic)

      xhr :get, :read, post_number: 2, id: topic.id

      expect(response.status).to eq 200
      expect(TopicUser.get(topic, user).last_read_post_number).to eq 2
      expect(response_json['last_read_post_number']).to eq 2
    end

    it "does not read posts for users who are not logged in" do
      group.users << another_user
      5.times { make_a_post(topic) }

      xhr :get, :read, post_number: 2, id: topic.id
      expect(response.status).to eq 403
      expect(response_json['errors']).to be_present
    end
  end

  describe "groups" do
    before do
      user.update(admin: true)
      group.users << user
    end

    it "returns the allowed groups for a babble topic" do
      topic.allowed_groups << allowed_group_a
      xhr :get, :groups, id: topic.id
      expect(response).to be_success
      json = JSON.parse(response.body)['topics']
      group_ids = json.map { |g| g['id'] }
      expect(group_ids).to include allowed_group_a.id
      expect(group_ids).to_not include allowed_group_b.id
    end

    it "does not return allowed groups unless the user is an admin" do
      user.update(admin: false)
      xhr :get, :groups, id: topic.id
      expect(response.status).to eq 403
    end

    it "does not return allowed groups for non-chat topics" do
      xhr :get, :groups, id: non_chat_topic.id
      expect(response.status).to eq 404
    end
  end

  def make_a_post(t)
    Babble::PostCreator.create(another_user, raw: 'I am a test post', skip_validations: true, topic_id: t.id)
  end

  def response_json
    JSON.parse(response.body)
  end

end
