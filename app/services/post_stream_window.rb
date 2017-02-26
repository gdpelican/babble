class PostStreamWindow
  def self.for(topic:, from: (topic.highest_post_number+1), order: :desc, limit: SiteSetting.babble_page_size)
    lt_or_gt = (order.to_sym == :desc) ? '<=' : '>='
    topic.posts.includes(:user)
               .where("post_number #{lt_or_gt} ?", from)
               .order(post_number: order)
               .limit(limit)
  end
end
