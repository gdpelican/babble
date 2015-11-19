class RevertB0rkingTopicUserMigration < ActiveRecord::Migration
  def up
    return unless category = Category.find_by(name: 'chat')
    category.topics.update_all(user_id: Babble::User.instance.id)
  end

  def down
  end

end
