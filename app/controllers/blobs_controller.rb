# frozen_string_literal: true

class BlobsController < ActiveStorage::BlobsController
  def show
    return super unless @blob.image?

    redirect_to @blob.variant(resize: '250x250').processed.service_url(disposition: params[:disposition])
  end
end
