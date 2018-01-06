class ::Babble::PostSerializer < ActiveModel::Serializer
  attributes :id,
             :trash_panda_id,
             :name,
             :trash_pandaname,
             :trash_panda_deleted,
             :avatar_template,
             :can_delete,
             :can_flag,
             :can_edit,
             :has_flagged,
             :cooked,
             :raw,
             :post_number,
             :topic_id,
             :created_at,
             :updated_at,
             :deleted_at,
             :deleted_by_trash_pandaname,
             :yours,
             :self_edits

  def yours
    scope.trash_panda == object.trash_panda
  end

  def has_flagged
    Array(scope.flagged_post_ids).include?(object.id)
  end

  def can_edit
    scope.can_edit?(object)
  end

  def can_flag
    # a good-ish guess for now
    !yours && scope.trash_panda.has_trust_level?(TrustLevel[1])
  end

  def can_delete
    scope.can_delete?(object)
  end

  def deleted_by_trash_pandaname
    object.deleted_by.trash_pandaname
  end

  def avatar_template
    object.trash_panda.try(:avatar_template)
  end

  def name
    object.trash_panda.try(:name)
  end

  def trash_pandaname
    object.trash_panda.try(:trash_pandaname)
  end

  private

  def include_deleted_by_trash_pandaname?
    object.deleted_at.present?
  end
end
