document.addEventListener('DOMContentLoaded', () => {
  let trix, form;

  document.addEventListener('trix-initialize', () => {
    // Get the trix editor element
    trix = document.querySelector('trix-editor');

    // Get the form element
    form = trix.closest('form');
  });

  /**
   * Add the Trix event listener when adding attachments to the editor.
   */
  document.addEventListener('trix-attachment-add', (event) => {
    // Make sure we actually have those elements
    if (trix && form) {
      // Get the attachment from the editor
      const attachment = event.attachment;

      // Make sure we have an attachment and that attachment has a file
      if (attachment && attachment.file) {
        return uploadAttachment(trix, attachment);
      }
    }
  });

  /**
   * Add the Trix event listener when removing attachments to the editor.
   */
  document.addEventListener('trix-attachment-remove', (event) => {
    //event.attachment.attachment.releaseFile(); // If your going to go through the bonus content, remove this line

    // BONUS CONTENT!
    // We will need to do a little bit of finagling to get the blob's signed_id to properly
    // remove it's attachment from the server since Trix doesn't
    // give you the actual file attachment or any relevant attachment ids back :/

    // Get the attachment to of the Trix editor
    const attachment = event.attachment.attachment;

    if (attachment) {
      // Get the blob's signed id
      const signedId = attachment.getAttributes().href.split('/')[2];

      // Remove the image from the form
      getOtherImages()
        .filter((image) => image.value === signedId)
        .map((filteredImages) => filteredImages.remove());
      
      deleteAttachment(attachment, signedId);
    }
  });

  /**
   * Uploads the attachment to the Rails backend via DirectUpload.
   * @param {HTMLElement} trix Trix editor HTML element
   * @param {Object} attachment Attachment from the Trix editor
   */
  function uploadAttachment(trix, attachment) {
    // Get the URL for uploading the attachment
    // Since we integrated Trix with Rails via Action Text,
    // we can get the upload URL from the editor itself -- BONUS!
    const url = trix.dataset.directUploadUrl;

    // Get the upload handler from Active Storage
    // This will ALWAYS create a new Blob record in the backend
    const upload = new ActiveStorage.DirectUpload(attachment.file, url);

    // Create the upload
    upload.create((error, blob) => {
      if (error) {
        console.error(`Error: ${error}`);
      } else {
        // Create the element to hold the images we'll upload and append it to the form
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('value', blob.signed_id);
        hiddenField.name = 'post[other_images][]';
        form.appendChild(hiddenField);

        // Attach to the Trix editor
        attachToTrix(attachment, blob);
      }
    });
  }

  /**
   * Attaches an attachment to the Trix editor via XHR.
   * @param {Object} attachment Object to attach to the editor
   * @param {Object} blob Active Storage blob to determine where to store it on the Rails side
   */
  function attachToTrix(attachment, blob) {
    // Create a new XHR Request object
    const xhr = new XMLHttpRequest();

    // Setup the url where we will save the attachment
    const url = `/blobs/${blob.signed_id}/${blob.filename}.json`;

    xhr.open('POST', url, true);

    // Make sure we set the correct headers so Rails doesn't block us
    xhr.setRequestHeader('X-CSRF-TOKEN', Rails.csrfToken());

    // Listen for the load XHR event and set the proper attributes on the attachment
    xhr.addEventListener('load', function (event) {
      if (xhr.readyState === 4 && xhr.status === 200) {
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

  /**
   * Sends an XHR request to remove the attachment from the backend.
   * @param {Object} attachment Object that is attached to the editor
   * @param {String} signedId The signed_id of the Blob
   */
  function deleteAttachment(attachment, signedId) {
    // Make sure we have the signed id
    if (signedId) {
      // Create a new XHR request
      const xhr = new XMLHttpRequest();
      const filename = attachment.getAttributes().filename;
      const formData = new FormData(form);

      // Open a DELETE request to remove the resource from the server
      xhr.open('DELETE', `/attachments/${signedId}/${filename}.json`, true);

      // Make sure we set the correct headers so Rails doesn't block us
      xhr.setRequestHeader('X-CSRF-TOKEN', Rails.csrfToken());

      // As long as the load XHR event is fired...
      xhr.addEventListener('load', () => {
        if (xhr.readyState === 4 && xhr.status === 204) {
          // ...remove the attachment form trix
          removeFromTrix(attachment);
        }
      });

      // Send off the request
      xhr.send(getTrixContent(formData, signedId));
    } else {
      // Otherwise remove the attachment
      removeFromTrix(attachment);
    }
  }

  /**
   * Gets the content from the Trix editor that we will send via XHR.
   * @param {FormData} formData Form data that will be appended to
   * @param {String} signedId The signed_id of the Blob
   * @return FormData with the modified 'content' value.
   */
  function getTrixContent(formData, signedId) {
    // We need to get the current state of the Trix editor's content
    const postContent = document.querySelector('input[name="post[content]"]').value;

    // We create an HTMl document fragment so that we can query it for the value we want
    const fragment = document.createRange().createContextualFragment(postContent);

    // Query the fragment to find the image we want to remove from the content
    const removedAttachment = fragment.querySelector(`a[data-trix-attachment*="${signedId}"]`);

    // We need to create a "container" to host the modified HTML fragment.
    const div = document.createElement('div');

    // We want to remove the attachment from the fragment.
    fragment.firstChild.removeChild(removedAttachment);

    // We append the fragment to the containing element.
    div.appendChild(fragment);

    // The form that we use already has a "content" field so we are just overwriting with the new data.
    formData.set('content', div.innerHTML);

    // Trim the data sent through the XHR request. We only care about the 'content'.
    formData = trimFormData(formData);

    return formData;
  }

  /**
   * @param {Object} attachment Object that is attached to the editor
   */
  function removeFromTrix(attachment) {
    // Release the file from the Trix editor
    attachment.releaseFile();
  }

  /**
   * Gets all of the images attached to the Trix editor.
   * @return An array of HTML elements containing a Post's 'other_images'.
   */
  function getOtherImages() {
    return Array.from(document.querySelectorAll('input[name="post[other_images][]"]'));
  }

  /**
   * Trim the FormData to remove all but the 'content' of the form.
   * @param {FormData} formData Instance of a FormData class.
   * @return FormData that only contains the 'content' key/value pair.
   */
  function trimFormData(formData) {
    const map = new Map(formData);

    for (let key of map.keys()) {
      if (key !== 'content') {
        formData.delete(key);
      }
    }

    return formData;
  }
});
