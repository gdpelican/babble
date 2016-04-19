class ::Babble::PostSerializer < ::PostSerializer
  attributes :image_count

  def initialize(object, opts = {})
    super object, opts.merge(add_raw: true)
  end
end
