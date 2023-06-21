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

  test 'should analyze dataset' do
    assert_enqueued_jobs 1 do
      assert_difference('Report.count') do
        post analyze_dataset_url(@dataset), as: :json
        assert_response :created
      end
    end

    report = Report.order(:created_at).last
    assert_equal 'queued', report.status
  end

  test 'should destroy dataset' do
    assert_difference('Dataset.count', -1) do
      delete dataset_url(@dataset), as: :json
    end

    assert_response :no_content
  end
end
