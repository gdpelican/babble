class ::Babble::PostsController < ::ApplicationController
  requires_plugin Babble::BABBLE_PLUGIN_NAME
  include ::Babble::Controller
  before_filter :ensure_logged_in, except: :index

  def index
    perform_fetch do
      respond_with PostStreamWindow.for(post_stream_params), serializer: Babble::PostSerializer
    end
  end

  def create
    perform_fetch do
      @post = Babble::PostCreator.create(current_user, post_creator_params)
      if @post.persisted?
        created_callback @post
        respond_with @post, serializer: Babble::PostSerializer
      else
        respond_with_unprocessable
      end
    end
  end

  def update
    perform_fetch do
      if !guardian.can_edit_post?(topic_post)
        respond_with_forbidden
      elsif Babble::PostRevisor.new(topic_post, topic).revise!(current_user, params.slice(:raw))
        respond_with topic_post, serializer: Babble::PostSerializer, extras: { is_edit: true }
      else
        respond_with_unprocessable
      end
    end
  end

  def destroy
    perform_fetch do
      if !guardian.can_delete_post?(topic_post)
        respond_with_forbidden
      else
        Babble::PostDestroyer.new(current_user, topic_post).destroy
        respond_with topic_post, serializer: Babble::PostSerializer, extras: { is_delete: true }
      end
    end
  end

  private

  def topic
    @topic ||= Babble::Topic.find_by(id: params[:topic_id])
  end

  def topic_post
    @topic_post ||= Post.find_by(id: params[:id])
  end

  def post_stream_params
    {
      topic:    topic,
      from:     params.fetch(:post_number, topic.highest_post_number+1),
      order:    params.fetch(:order, :desc)
    }
  end

  def post_creator_params
    {
      topic_id:         params[:topic_id],
      raw:              params[:raw],
      skip_validations: true
    }
  end

  def created_callback(post)
    if SiteSetting.babble_remote_post && !params[:skip_callback]
      Excon.post(SiteSetting.babble_remote_url,
        body: { current_user: current_user.username, message: post.cooked }.to_json,
        headers: { 'Content-Type' => 'application/json', 'Accept' => 'applicaton/json' }
      )
    end
  end
end
