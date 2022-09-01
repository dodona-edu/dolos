require "test_helper"

class ReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @report = create(:report)
    @dataset = @report.dataset
  end

  test "should get index" do
    get reports_url, as: :json
    assert_response :success
  end

  test "should show report" do
    get report_url(@report), as: :json
    assert_response :success
  end

  test "should upload dataset and create report" do

    assert_enqueued_jobs 1, only: AnalyzeDatasetJob do
      zipfile = fixture_file_upload(Rails.root.join('test/files/simple-dataset.zip'), 'application/zip')
      assert_difference("Dataset.count") do
        assert_difference("Report.count") do
          post(reports_url, params: { dataset: { name: @dataset.name, programming_language: @dataset.programming_language, zipfile: zipfile } })
          assert_response :created
        end
      end

      dataset = Dataset.order(:created_at).last
      assert dataset.zipfile.attached?
    end
  end

  test "should destroy report" do
    assert_difference("Report.count", -1) do
      delete report_url(@report), as: :json
    end

    assert_response :no_content
  end
end
