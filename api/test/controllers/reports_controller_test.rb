require 'test_helper'

class ReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @report = create(:report)
    @dataset = @report.dataset
  end

  test 'should show report' do
    get report_url(@report), as: :json
    assert_response :success
  end

  test 'should include frontend url in report json' do
    get report_url(@report), as: :json
    assert_response :success
    json = JSON.parse(@response.body)
    assert_equal "https://example.com/frontend/#/share/#{@report.id}", json['html_url']
  end

  test 'should report files' do
    %w[metadata.csv files.csv kgrams.csv pairs.csv].each do |f|
      get data_report_url(@report, f)
      assert_response :redirect, "Expected #{f} to be present"
    end
  end

  test 'should upload dataset and create report' do
    assert_enqueued_jobs 1, only: AnalyzeDatasetJob do
      zipfile = fixture_file_upload(Rails.root.join('test/files/simple-dataset.zip'), 'application/zip')
      assert_difference('Dataset.count') do
        assert_difference('Report.count') do
          post(reports_url, params: { dataset: { name: @dataset.name, programming_language: @dataset.programming_language, zipfile: zipfile } })
          assert_response :created
        end
      end

      dataset = Dataset.order(:created_at).last
      assert dataset.zipfile.attached?
    end
  end

  test 'dataset and report name should default to file name' do
    assert_enqueued_jobs 1, only: AnalyzeDatasetJob do
      zipfile = fixture_file_upload(Rails.root.join('test/files/simple-dataset.zip'), 'application/zip')
      assert_difference('Dataset.count') do
        assert_difference('Report.count') do
          post(reports_url, params: { dataset: { zipfile: zipfile } })
          assert_response :created
        end
      end

      dataset = Dataset.order(:created_at).last
      report = Report.order(:created_at).last

      assert_equal 'simple-dataset', dataset.name
      assert_equal 'simple-dataset', report.name
    end
  end

  test 'should purge report but keep records' do
    delete report_url(@report), as: :json
    assert_response :no_content

    @report.reload
    @dataset.reload

    assert_equal @report.status, 'purged'

    assert_not @report.all_files_present?

    %w[metadata.csv files.csv kgrams.csv pairs.csv].each do |f|
      get data_report_url(@report, f)
      assert_response :not_found
    end
  end

  test 'should successfully show purged reports' do
    delete report_url(@report), as: :json
    assert_response :no_content

    @report.reload
    assert_equal @report.status, 'purged'

    get report_url(@report), as: :json
    assert_response :success
  end
end
