# frozen_string_literal: true

json.extract! post, :id, :title, :body, :posted_at, :created_at, :updated_at
json.url post_url(post, format: :json)

json.main_image_url rails_blob_url(post.main_image, disposition: 'attachment') if post.main_image.present?

json.other_images post.other_images.each do |other|
  json.id other.id
  json.url rails_blob_url(other, disposition: 'attachment')
end
