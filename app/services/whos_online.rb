Babble::WhosOnline = Struct.new(:topic) do
  def add(user)
    $redis.set online_cache_key, (online_user_ids + Array(user.id.to_s)).uniq
    online_users
  end

  def remove(user)
    $redis.set online_cache_key, (online_user_ids - Array(user.id.to_s)).uniq
    online_users
  end

  private

  def online_users
    User.where id: online_user_ids
  end

  def online_user_ids
    JSON.parse $redis.get(online_cache_key) || '[]'
  end

  def online_cache_key
    "babble-online-#{topic.id}"
  end

end
