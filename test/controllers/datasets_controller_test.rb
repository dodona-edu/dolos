require "test_helper"

class DatasetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @dataset = create(:dataset)
    @zipfile = fixture_file_upload(Rails.root.join('test/files/simple-dataset.zip'), 'application/zip')
  end

  test "should get index" do
    get datasets_url, as: :json
    assert_response :success
  end

  test "should create dataset" do
    assert_difference("Dataset.count") do
      post datasets_url, params: { dataset: { name: @dataset.name, programming_language: @dataset.programming_language, zipfile: @zipfile } }

      assert_response :created

      dataset = Dataset.order(:created_at).last
      assert dataset.zipfile.attached?
    end
  end

  test "should show dataset" do
    get dataset_url(@dataset), as: :json
    assert_response :success
  end

  test "should analyze dataset" do
    assert_enqueued_jobs 1 do
      assert_difference("Report.count") do
        post analyze_dataset_url(@dataset), as: :json
        assert_response :created
      end
    end

    report = Report.order(:created_at).last
    assert_equal "queued", report.status
  end

  test "should destroy dataset" do
    assert_difference("Dataset.count", -1) do
      delete dataset_url(@dataset), as: :json
    end

    assert_response :no_content
  end
end
