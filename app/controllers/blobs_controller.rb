class BlobsController < ActiveStorage::BlobsController
  def show
    redirect_to @blob.variant(resize: '250x250').processed.service_url(disposition: params[:disposition]) if @blob.image?

    super unless @blob.image?
  end

  def destroy
    respond_to do |format|
      byebug
      blob = ActiveStorage::Blob.find_signed(params[:signed_id]).purge


      # blob.attachments.each do |attachment|
      #   klass = Object.const_get(attachment.record_type).find(attachment.record_id)
      #   klass.other_images.each { |image| image.purge }
      # end

      format.json { head :no_content }
    end
  end
end
