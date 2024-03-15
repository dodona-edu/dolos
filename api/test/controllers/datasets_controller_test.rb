require 'test_helper'

class DatasetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @dataset = create(:dataset)
    @zipfile = fixture_file_upload(Rails.root.join('test/files/simple-dataset.zip'), 'application/zip')
  end

  test 'should show dataset' do
    get dataset_url(@dataset), as: :json
    assert_response :success
  end
end
