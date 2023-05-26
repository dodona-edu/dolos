require 'test_helper'

class AnalyzeDatasetJobTest < ActiveJob::TestCase
  setup do
    @report = create(:report)
  end

  test 'run analyze dataset job' do
    AnalyzeDatasetJob.perform_now(@report)
    assert_empty @report.stderr
    assert_nil @report.error
    assert_equal 'finished', @report.status
    assert @report.all_files_present?
  end

  test 'should detect programming language' do
    assert_nil @report.dataset.programming_language

    AnalyzeDatasetJob.perform_now(@report)

    assert_equal 'javascript', @report.reload.dataset.programming_language
  end

  test 'should have correct report name' do
    assert_nil @report.dataset.programming_language

    AnalyzeDatasetJob.perform_now(@report)

    metadata_name = CSV.parse(@report.reload.metadata.download).filter_map { |k, v, _| v if k == 'reportName' }.first
    assert_equal @report.dataset.name, metadata_name
  end

  test 'should not overwrite programming language' do
    @report.dataset.update(programming_language: 'python')

    AnalyzeDatasetJob.perform_now(@report)

    assert_equal 'python', @report.reload.dataset.programming_language
  end
end
