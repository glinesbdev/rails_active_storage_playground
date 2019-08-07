# frozen_string_literal: true

class AttachmentsController < ApplicationController
  def destroy
    @blob = id.present? ? ActiveStorage::Attachment.find(id).blob : ActiveStorage::Blob.find_signed(signed_id)

    # We are doing this in a transaction because we don't want anything to change if something fails
    @blob.transaction do
      if any_attachments?
        # The way we are handling blobs, they will always only have a single attachment
        # https://github.com/rails/rails/blob/v6.0.0.rc2/activestorage/app/javascript/activestorage/direct_upload.js#L22
        attachment = @blob.attachments.first
        @record_name = attachment.name
        @record = attachment.record_type.constantize.find(attachment.record_id)

        attachment.purge_later
      end

      # Destroy the blob that doesn't have any attachments
      @blob.purge unless any_attachments?

      # We need to update the new content coming through in the case that the user's
      # internet connection drops or if the page is reloaded after the XHR request
      @record.update_attribute(:content, content) if should_update?
    end

    respond_with nil do |format|
      format.html { destroy_redirect }
      format.json { head :no_content }
    end
  end

  private

  def attachment_params
    params.permit(:id, :post_id, :signed_id, :filename, :content)
  end

  def id
    attachment_params[:id]
  end

  def content
    attachment_params[:content]
  end

  def post_id
    attachment_params[:post_id]
  end

  def signed_id
    attachment_params[:signed_id]
  end

  def any_attachments?
    @blob.attachments.any?
  end

  def should_update?
    @record&.respond_to?(:content) && @record_name != 'main_image'
  end

  def destroy_redirect
    redirect_to post_id.present? ? edit_post_url(post_id) : posts_path
  end
end
