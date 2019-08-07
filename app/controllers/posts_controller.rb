# frozen_string_literal: true

class PostsController < ApplicationController
  before_action :set_post, only: [:show, :edit, :update, :destroy]

  # GET /posts
  # GET /posts.json
  def index
    @posts = Post.all
  end

  # GET /posts/1
  # GET /posts/1.json
  def show
  end

  # GET /posts/new
  def new
    @post = Post.new
  end

  # GET /posts/1/edit
  def edit
  end

  # POST /posts
  # POST /posts.json
  def create
    @post = Post.new(post_params)

    attach_other_images if @post.save
    respond_with @post
  end

  # PATCH/PUT /posts/1
  # PATCH/PUT /posts/1.json
  def update
    attach_other_images if @post.update(post_params)
    respond_with @post
  end

  # DELETE /posts/1
  # DELETE /posts/1.json
  def destroy
    @post.destroy
    respond_with @post
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_post
    @post = Post.with_attached_other_images.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def post_params
    params.require(:post).permit(:title, :body, :posted_at, :content, :remove_main_image, :main_image, other_images: [])
  end

  def attach_other_images
    return unless params[:other_images].present?

    params[:other_images].each do |signed_blob_id|
      @post.attach_other_images(signed_blob_id)
    end
  end
end
