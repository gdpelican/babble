# name: babble
# about: Shoutbox plugin for Discourse
# version: 4.0.3
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
  babble_require 'controllers/root_controller'
  babble_require 'controllers/topics_controller'
  babble_require 'controllers/posts_controller'

  babble_require 'serializers/basic_topic_serializer'
  babble_require 'serializers/notification_serializer'
  babble_require 'serializers/post_serializer'
  babble_require 'serializers/site_serializer'
  babble_require 'serializers/summary_serializer'
  babble_require 'serializers/topic_serializer'
  babble_require 'serializers/user_serializer'
  babble_require 'serializers/boot_serializer'

  babble_require 'services/post_creator'
  babble_require 'services/post_alerter'
  babble_require 'services/post_destroyer'
  babble_require 'services/post_revisor'
  babble_require 'services/broadcaster'
  babble_require 'services/post_stream_window'

  babble_require 'models/archetype'
  babble_require 'models/chat'
  babble_require 'models/guardian'
  babble_require 'models/group'
  babble_require 'models/notification'
  babble_require 'models/post'
  babble_require 'models/search'
  babble_require 'models/topic_query'
  babble_require 'models/topic'
  babble_require 'models/user'
  babble_require 'models/user_action'
  babble_require 'models/user_summary'
  babble_require 'models/chats/base'
  babble_require 'models/chats/category'
  babble_require 'models/chats/group'
  babble_require 'models/chats/pm'

  babble_require 'jobs/regular/babble_post_alert'
  babble_require 'jobs/scheduled/babble_prune_history'

  register_editable_user_custom_field :babble_disabled
  register_editable_user_custom_field :babble_sound
  register_editable_user_custom_field :babble_open_by_default

  DiscoursePluginRegistry.serialized_current_user_fields << 'babble_disabled'
  DiscoursePluginRegistry.serialized_current_user_fields << 'babble_sound'
  DiscoursePluginRegistry.serialized_current_user_fields << 'babble_open_by_default'

  on :post_created do |post, opts, user|
    if post.topic&.archetype == Archetype.chat
      TopicUser.update_last_read(user, post.topic_id, post.post_number, post.post_number, PostTiming::MAX_READ_TIME_PER_BATCH)
      Jobs.enqueue(:babble_post_alert, post_id: post.id)
    end
  end
end
