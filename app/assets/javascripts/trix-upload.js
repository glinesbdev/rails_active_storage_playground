/** 
 * Get the value of the window.TrixStorage object or assign it to a new object.
*/
window.TrixStorage = window.TrixStorage || {};

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
  const url = `/blobs/${blob.signed_id}/${blob.filename}`;

  xhr.open('POST', url, true);

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

document.addEventListener('trix-attachment-remove', (event) => {
  event.attachment.attachment.releaseFile(); // If your going to use this even with the bonus content, remove this line

  // BONUS CONTENT!
  // We will need to do a little bit of finagling to get the blob's signed_id to properly remove it from the server

  // Get the previewURL segments that contains the blob's signed id
  const urlSegments = event.attachment.attachment.previewURL.split('/');

  // Filter the string to extract the id
  const signedId = urlSegments.filter(segment => segment.indexOf('--') > -1)[0];

  // Make sure we have a signed id
  if (signedId) {
    // Create a new XHR request
    const xhr = new XMLHttpRequest();

      // Open a DELETE request to remove the resource from the server
      xhr.open('DELETE', `/blobs/${signedId}`, true);

      // Make sure we set the correct headers so Rails doesn't block us
      xhr.setRequestHeader('X-CSRF-TOKEN', Rails.csrfToken());

      // As long as the load XHR event is fired...
      xhr.addEventListener('load', function () {
        // ... and the status is 204 ...
        if (xhr.status === 204) {
          // Release the file from the editor
          event.attachment.attachment.releaseFile();
        }
      });

      // Send off the request
      xhr.send(null);
  } else {
    // Handle the fact that you don't have the id based on your needs...
  }
});
