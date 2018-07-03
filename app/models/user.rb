class ::User
  module HideChatNotifications
    def unread_notifications
      @unread_notifications ||= begin
        sql = <<~SQL
          SELECT COUNT(*)
          FROM notifications n
          LEFT JOIN topics t ON t.id = n.topic_id
          WHERE t.deleted_at IS NULL
          AND t.archetype <> :chat
          AND n.notification_type <> :pm
          AND n.user_id = :user_id
          AND n.id > :seen_notification_id
          AND NOT read
        SQL

        DB.query_single(sql,
          user_id: id,
          seen_notification_id: seen_notification_id,
          pm:  Notification.types[:private_message],
          chat: Archetype.chat
        )[0].to_i
      end
    end
  end
  prepend HideChatNotifications
end
