require './plugins/babble/spec/babble_helper'

describe Jobs::BabblePruneHistory do
  it 'marks old posts as hidden' do
    topic    = Fabricate :topic, archetype: :chat
    old_post = Fabricate :post, topic: topic, created_at: 3.days.ago
    new_post = Fabricate :post, topic: topic, created_at: 1.day.ago

    SiteSetting.babble_prune_history = 2

    described_class.new.execute({})
    expect(old_post.reload.hidden).to eq true
    expect(new_post.reload.hidden).to eq false
    expect(topic.custom_fields[:lowest_post_number]).to eq new_post.post_number
  end
end
