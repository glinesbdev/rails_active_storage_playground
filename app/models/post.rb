class Post < ApplicationRecord
  has_one :photo, dependent: :nullify
  accepts_nested_attributes_for :photo, allow_destroy: true, update_only: true

  has_rich_text :content
end
