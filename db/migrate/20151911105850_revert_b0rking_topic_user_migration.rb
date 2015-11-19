class RevertB0rkingTopicUserMigration < ActiveRecord::Migration
  def up
    Category.find_by(name: 'chat').topics.update_all(user_id: Babble::User.instance.id)
  end

  def down
  end

end
