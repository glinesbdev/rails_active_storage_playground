class Photo < ApplicationRecord
  belongs_to :post
  
  has_one_attached :main_image
  has_many_attached :other_images
end
