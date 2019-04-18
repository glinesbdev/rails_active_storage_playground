/**
 * Add the Trix event listener when adding attachments to the editor.
 */
document.addEventListener('trix-attachment-add', (event) => {
  // Get the trix editor element
  const trix = document.querySelector('trix-editor');

  // Get the form element
  const form = trix.closest('form');

  // Make sure we actually have those elements
  if (trix && form) {
    // Get the attachment from the editor
    const attachment = event.attachment;

    // Make sure we have an attachment and that
    // attachment has a file
    if (attachment && attachment.file) {
      return upload(trix, form, attachment);
    }
  }
});

/**
 * 
 * @param trix Trix editor HTML element
 * @param form Form HTML element
 * @param attachment Attachment from the Trix editor
 */
function upload(trix, form, attachment) {
  // Get the URL for uploading the attachment
  // Since we integrated Trix with Rails via Action Text,
  // we can get the upload URL from the editor itself -- BONUS!
  const url = trix.dataset.directUploadUrl;

  // Get the upload handler from Active Storage
  const upload = new ActiveStorage.DirectUpload(attachment.file, url);

  // Create the upload
  upload.create((error, blob) => {
    if (error) {
      console.error(error);
    } else {
      // Get all of the fields required for upload
      const hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('value', blob.signed_id);
      hiddenField.name = 'post[photo_attributes][other_images][]';
      form.appendChild(hiddenField);

      // Attach to the Trix editor
      attachToTrix(attachment, blob);
    }
  });
}

/**
 * 
 * @param attachment Object to attach to the editor
 * @param blob Active Storage blob to determine where to store it on the Rails side
 */
function attachToTrix(attachment, blob) {
  // Create a new XHR Request object
  const xhr = new XMLHttpRequest();

  // Setup the url where we will save the attachment
  const url = `/rails/active_storage/blobs/${blob.signed_id}/${blob.filename}`;

  xhr.open('GET', url, true);

  // Listen for the load XHR event and set the proper attributes on the attachment
  xhr.addEventListener('load', function (event) {
    if (xhr.status === 200) {
      const attributes = {
        url: url,
        href: `${url}?disposition=attachment`
      };

      attachment.setAttributes(attributes);
    }
  });

  // Fire off the XHR request
  xhr.send(null);
}

// Listen for the event when an attachment is removed from the Trix editor
document.addEventListener('trix-attachment-remove', (event) => {
  // Get all of the attachments in the editor
  const inputs = document.querySelectorAll('input[name="post[photo_attributes][other_images][]"]');

  // Iterate over all attachments
  inputs.forEach((element) => {
    // Make sure that we can find the attachment to be removed
    const previewURL = event.attachment.attachment.previewURL;
    const index = previewURL.indexOf(element.value);
    const signed_id = previewURL.substr(index, element.value.length);
    
    // If we have the attachment...
    if (index > -1) {
      // ...create and send an XHR request to delete the object from our project
      const xhr = new XMLHttpRequest();

      xhr.open('DELETE', `/blobs/${signed_id}`, true);
      xhr.setRequestHeader('X-CSRF-TOKEN', Rails.csrfToken());

      xhr.addEventListener('load', function () {
        if (xhr.status === 204) {
          event.attachment.attachment.releaseFile();
          element.remove();
        }
      });

      xhr.send(null);
    }
  });
});