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

  test "should destroy report" do
    assert_difference("Report.count", -1) do
      delete report_url(@report), as: :json
    end

    assert_response :no_content
  end
end
