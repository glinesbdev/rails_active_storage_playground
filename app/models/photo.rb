class Photo < ApplicationRecord
  belongs_to :post
  
  has_one_attached :main_image
  has_many_attached :other_images

  def attach_other_images(signed_blob_id)
    blob = ActiveStorage::Blob.find_signed(signed_blob_id)

    if blob.present?
      other_images.attach(blob.signed_id) unless other_images.attachments.map(&:blob_id).include?(blob.id)
    else
      other_images.attach(signed_blob_id)
    end
  end
end
