# frozen_string_literal: true

require 'test_helper'

class BlobsControllerTest < ActionDispatch::IntegrationTest
  test 'should get destroy' do
    get blobs_destroy_url
    assert_response :success
  end
end
