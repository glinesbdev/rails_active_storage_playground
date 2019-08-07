# frozen_string_literal: true

class Post < ApplicationRecord
  has_rich_text :content
  has_one_attached :main_image
  has_many_attached :other_images

  def attach_other_images(signed_blob_id)
    blob = ActiveStorage::Blob.find_signed(signed_blob_id)
    return other_images.attach(signed_blob_id) unless blob.present?

    other_images.attach(blob.signed_id) unless other_images.attachments.map(&:blob_id).include?(blob.id)
  end
end
