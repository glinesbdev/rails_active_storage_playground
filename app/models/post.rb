class Post < ApplicationRecord
  has_one :photo, dependent: :nullify
  accepts_nested_attributes_for :photo
end
