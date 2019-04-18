class BlobsController < ApplicationController
  def destroy
    respond_to do |format|
      blob = ActiveStorage::Blob.find_signed(params[:signed_id])

      blob.attachments.each do |attachment|
        klass = Object.const_get(attachment.record_type).find(attachment.record_id)
        klass.other_images.each { |image| image.purge }
      end

      format.json { head :no_content }
    end
  end
end
