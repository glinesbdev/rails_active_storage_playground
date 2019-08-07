# frozen_string_literal: true

Rails.application.routes.draw do
  root 'posts#index'
  match 'blobs/:signed_id/*filename', to: 'blobs#show', via: [:get, :post]
  delete 'attachments/:signed_id/*filename', to: 'attachments#destroy'
  resources :attachments, only: [:destroy], as: :destroy_attachment
  resources :posts
end
