require "spec_helper"

describe ::Babble::TopicController do
  routes { ::Babble::Engine.routes }

  describe "show" do

    it "returns the babble topic when it exists" do
      Babble::Topic.ensure_existence
      xhr :get, :show

      expect(response).to be_success
      json = ::JSON.parse(response.body)
      expect(json['topic']['id']).to eq BABBLE_TOPIC_ID
      expect(json['topic']['title']).to eq BABBLE_TOPIC_TITLE
    end

    it "creates and returns the babble topic when it doesn't exist" do
      xhr :get, :show

      json = ::JSON.parse(response.body)
      expect(json['topic']['id']).to eq BABBLE_TOPIC_ID
      expect(json['topic']['title']).to eq BABBLE_TOPIC_TITLE
    end

  end

end
