require "spec_helper"

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
  let!(:topic) { Babble::Topic.create_topic "test topic for babble", group }
  let!(:another_topic) { Babble::Topic.create_topic "another test topic", Fabricate(:group, name: 'group_name') }

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
      expect(response.status).to eq 422
      expect(response_json['errors']).to be_present
    end
  end

  describe "post" do
    it "adds a new post to the chat topic" do
      group.users << user
      expect { xhr :post, :post, raw: "I am a test post", id: topic.id }.to change { topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it "can add a short post to the chat topic" do
      group.users << user
      expect { xhr :post, :post, raw: "Hi!", id: topic.id }.to change { topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it 'does not allow posts with no content to be made' do
      group.users << user
      expect { xhr :post, :post, id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 422
    end

    it "cannot create a post in a topic the user does not have access to" do
      user
      expect { xhr :post, :post, raw: "I am a test post!", id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 403
    end

    it "does not allow posts from users who are not logged in" do
      expect { xhr :post, :post, raw: "I am a test post", id: topic.id }.not_to change { topic.posts.count }
      expect(response.status).to eq 422
    end

    it "deletes old posts in a rolling window" do
      group.users << user
      group.users << another_user
      SiteSetting.babble_max_topic_size = 10

      xhr :post, :post, raw: "I am the original post", id: topic.id
      9.times { make_a_post(topic) }

      expect { xhr :post, :post, raw: "I've stepped over the post limit!", id: topic.id }.not_to change { topic.posts.count}
      expect(response.status).to eq 200

      post_contents = topic.posts.map(&:raw).uniq
      expect(post_contents).to include "I've stepped over the post limit!"
      expect(post_contents).to_not include "I am the original post"
    end
  end

  describe "read" do
    it "reads a post up to the given post number" do
      group.users << user
      5.times { make_a_post(topic) }
      TopicUser.find_or_create_by(user: user, topic: topic)

      xhr :get, :read, post_number: 2, id: topic.id

      expect(response.status).to eq 200
      expect(TopicUser.get(topic, user).last_read_post_number).to eq 2
      expect(response_json['last_read_post_number']).to eq 2
    end

    it "does not read posts for users who are not logged in" do
      5.times { make_a_post(topic) }

      xhr :get, :read, post_number: 2, id: topic.id
      expect(response.status).to eq 422
      expect(response_json['errors']).to be_present
    end
  end

  def make_a_post(t)
     Babble::PostCreator.create(another_user, raw: 'I am a test post', skip_validations: true, topic_id: t.id)
  end

  def response_json
    JSON.parse(response.body)
  end

end
