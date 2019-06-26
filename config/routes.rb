Rails.application.routes.draw do
  root to: 'posts#index'
  match 'blobs/:signed_id/*filename', to: 'blobs#show', via: [:get, :post]
  delete 'blobs/:signed_id', to: 'blobs#destroy'
  resources :posts
end
