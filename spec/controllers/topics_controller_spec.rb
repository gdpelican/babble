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
  let!(:topic) { Babble::Topic.create_topic "test topic for babble" }

  describe "show" do
    it "returns the default chat topic if it exists" do
      user
      xhr :get, :show
      expect(response_json['id']).to eq default_topic.id
    end

    it "returns a successful response with an error message if no suitable topics exist" do
      user
      topic.destroy
      xhr :get, :show
      expect(response.status).to eq 200
      expect(response_json['errors']).to be_present
    end

    it "returns an error if the user is logged out" do
      xhr :get, :show
      expect(response.status).to eq 422
      expect(response_json['errors']).to be_present
    end
  end

  describe "post" do
    it "adds a new post to the default chat topic" do
      user
      expect { xhr :post, :post, raw: "I am a test post" }.to change { default_topic.posts.count }.by(1)
      expect(response.status).to eq 200
    end

    it 'does not allow posts with no content to be made' do
      user
      expect { xhr :post, :post }.not_to change { default_topic.posts.count }
      expect(response.status).to eq 422
    end

    it "does not allow posts from users who are not logged in" do
      expect { xhr :post, :post, raw: "I am a test post" }.not_to change { default_topic.posts.count }
      expect(response.status).to eq 422
    end

    it "deletes old posts in a rolling window" do
      user
      SiteSetting.babble_max_topic_size = 10

      xhr :post, :post, raw: "I am the original post"
      9.times { xhr :post, :post, raw: "I am a test post" }

      expect { xhr :post, :post, raw: "I've stepped over the post limit!" }.not_to change { default_topic.posts.count}

      post_contents = Babble::Topic.default_topic.posts.map(&:raw).uniq
      expect(post_contents).to include "I've stepped over the post limit!"
      expect(post_contents).to_not include "I am the original post"
    end
  end

  describe "read" do
    it "reads a post up to the given post number" do
      5.times { make_a_post }
      TopicUser.find_or_create_by(user: user, topic: default_topic)

      xhr :get, :read, post_number: 2

      expect(response.status).to eq 200
      expect(TopicUser.get(default_topic, user).last_read_post_number).to eq 2
      expect(response_json['last_read_post_number']).to eq 2
    end

    it "does not read posts for users who are not logged in" do
      5.times { make_a_post }

      xhr :get, :read, post_number: 2
      expect(response.status).to eq 422
      expect(response_json['errors']).to be_present
    end
  end

  def default_topic
    Babble::Topic.default_topic
  end

  def make_a_post
     Babble::PostCreator.create(another_user, raw: 'I am a test post', skip_validations: true)
  end

  def response_json
    JSON.parse(response.body)
  end

end
