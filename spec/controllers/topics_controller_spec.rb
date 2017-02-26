require './plugins/babble/spec/babble_helper'

describe ::Babble::TopicsController do
  routes { ::Babble::Engine.routes }
  before { SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml')) }

  let(:user) { log_in }
  let(:another_user) { Fabricate :user }
  let(:group) { Fabricate :group }
  let(:another_group) { Fabricate :group, name: 'group_name' }
  let!(:topic) { Babble::Topic.save_topic title: "test topic for babble", allowed_group_ids: [group.id] }
  let(:category_topic) { Babble::Topic.save_topic category_chat_params }
  let!(:topic_post) { topic.posts.create(raw: "I am a post", user: user)}
  let(:category_topic_post) { category_topic.posts.create(raw: "I am a category post", user: user) }
  let!(:another_post) { topic.posts.create(raw: "I am another post", user: another_user) }
  let!(:another_topic) { Babble::Topic.save_topic title: "another test topic", allowed_group_ids: [another_group.id] }
  let(:non_chat_topic) { Fabricate :topic }
  let(:category) { Fabricate :category }

  let(:chat_params) {{
    permissions: "group",
    title: "This is a new topic title",
    allowed_group_ids: [allowed_group_a.id]
  }}
  let(:category_chat_params) {{
    permissions: "category",
    title: "This is a caategory topic",
    category_id: category.id
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

  describe "create" do
    before { user.update(admin: true) }

    it "creates a new chat topic" do
      expect { xhr :post, :create, topic: chat_params }.to change { Topic.where(archetype: :chat).count }.by(1)
      expect(response).to be_success

      new_topic = Babble::Topic.available_topics.last
      expect(new_topic.user).to eq Discourse.system_user
      expect(new_topic.title).to eq chat_params[:title]
      expect(new_topic.category).to be_nil
      expect(new_topic.allowed_groups.length).to eq 1
      expect(new_topic.allowed_groups).to include allowed_group_a
    end

    it "can create a new category chat topic" do
      expect { xhr :post, :create, topic: category_chat_params }.to change { Topic.where(archetype: :chat).count }.by(1)
      expect(response).to be_success

      new_topic = Babble::Topic.available_topics.last
      expect(category.reload.custom_fields['chat_topic_id']).to eq new_topic.id
      expect(new_topic.user).to eq Discourse.system_user
      expect(new_topic.title).to eq category_chat_params[:title]
      expect(new_topic.category).to eq category
      expect(new_topic.allowed_groups).to be_empty
    end

    it "respects the permissions parameter" do
      category_chat_params[:permissions] = "group"
      xhr :post, :create, topic: category_chat_params
      expect(response.status).to eq 422
    end

    it "can create a chat topic with a short name" do
      chat_params[:title] = 'short'
      expect { xhr :post, :create, topic: chat_params }.to change { Topic.where(archetype: :chat).count }.by(1)
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
      expect{ xhr :post, :create, topic: chat_params }.to_not change { Topic.where(archetype: :chat).count }
      expect(response.status).to eq 422
      expect(Babble::Topic.available_topics.last.title).not_to eq chat_params[:title]
    end

    it "does not allow multiple chat channels on a single category" do
      category_topic
      expect{ xhr :post, :create, topic: category_chat_params }.to_not change { Topic.where(archetype: :chat).count }
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

    it 'does not allow non-admins to update topics' do
      user.update(admin: false)
      xhr :post, :update, id: topic.id, topic: chat_params
      expect(response.status).to eq 403
      expect(Babble::Topic.find_by(id: topic.id).title).to_not eq chat_params[:title]
    end

    it "does not allow multiple chat channels on a single category" do
      category_topic
      expect{ xhr :post, :update, id: topic.id, topic: category_chat_params }.to_not change { Topic.where(archetype: :chat).count }
      expect(response.status).to eq 422
      expect(Babble::Topic.available_topics.last.title).not_to eq chat_params[:title]
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

    it "reverts a category's chat topic id" do
      xhr :delete, :destroy, id: category_topic.id
      expect(response).to be_success
      expect(Babble::Topic.available_topics).not_to include category_topic
      expect(category_topic.category.reload.custom_fields['chat_topic_id']).to_not eq category_topic.id
    end

    it "reverts a category's chat topic id if the topic has posts" do
      category_topic_post
      xhr :delete, :destroy, id: category_topic.id
      expect(response).to be_success
      expect(Babble::Topic.available_topics).not_to include category_topic
      expect(category_topic.category.reload.custom_fields['chat_topic_id']).to_not eq category_topic.id
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
