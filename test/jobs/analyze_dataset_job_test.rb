require "test_helper"

class AnalyzeDatasetJobTest < ActiveJob::TestCase
  setup do
    @report = create(:report)
  end

  test "run analyze dataset job" do
    AnalyzeDatasetJob.perform_now(@report)
    assert_nil @report.error
    assert_equal "finished", @report.status
    assert @report.all_files_present?
  end
end
