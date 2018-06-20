# name: babble
# about: Shoutbox plugin for Discourse
# version: 3.1.13
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble.scss"

enabled_site_setting :babble_enabled

def babble_require(path)
  require Rails.root.join('plugins', 'babble', 'app', path).to_s
end

babble_require 'extras/position_options'

after_initialize do

  babble_require 'initializers/babble'

  babble_require 'routes/babble'
  babble_require 'routes/discourse'

  babble_require 'controllers/controller'
  babble_require 'controllers/admin/chats_controller'
  babble_require 'controllers/topics_controller'
  babble_require 'controllers/posts_controller'

  babble_require 'serializers/notification_serializer'
  babble_require 'serializers/post_serializer'
  babble_require 'serializers/topic_serializer'

  babble_require 'services/post_creator'
  babble_require 'services/post_destroyer'
  babble_require 'services/post_revisor'
  babble_require 'services/broadcaster'
  babble_require 'services/post_stream_window'

  babble_require 'models/archetype'
  babble_require 'models/guardian'
  babble_require 'models/topic_query'
  babble_require 'models/topic'
  babble_require 'models/user_action'
  babble_require 'models/user_summary'

  babble_require 'jobs/scheduled/babble_prune_history'

  Category.register_custom_field_type('chat_topic_id', :integer)
  add_to_serializer(:basic_category, :chat_topic_id) { object.custom_fields['chat_topic_id'] unless object.custom_fields['chat_topic_id'].to_i == 0 }
  add_to_serializer(:basic_topic, :category_id)      { object.category_id if object.respond_to?(:category_id) }

  on :post_created do |post, opts, user|
    if post.topic.archetype == Archetype.chat
      post.trigger_post_process(true)
      TopicUser.update_last_read(user, post.topic.id, post.post_number, post.post_number, PostTiming::MAX_READ_TIME_PER_BATCH)
      PostAlerter.post_created(post)

      Babble::Broadcaster.publish_to_posts(post, user)
      Babble::Broadcaster.publish_to_topic(post.topic, user)
    end
  end

  class ::Topic
    module ForDigest
      def for_digest(user, since, opts=nil)
        super(user, since, opts).where('archetype <> ?', Archetype.chat)
      end
    end
    singleton_class.prepend ForDigest
  end

end
