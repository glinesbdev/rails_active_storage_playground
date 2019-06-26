json.extract! post, :id, :title, :body, :posted_date, :created_at, :updated_at
json.url post_url(post, format: :json)

if post.main_image.present?
  json.main_image_url rails_blob_url(post.main_image, disposition: 'attachment')
end

if post.other_images.any?
  json.other_images post.other_images.each do |other|
    json.id other.id
    json.url rails_blob_url(other, disposition: 'attachment')
  end
end