# == Schema Information
#
# Table name: reports
#
#  id          :bigint           not null, primary key
#  error       :text(65535)
#  exit_status :integer
#  memory      :integer
#  run_time    :float(24)
#  status      :integer
#  stderr      :text(65535)
#  stdout      :text(65535)
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  dataset_id  :bigint           not null
#
# Indexes
#
#  index_reports_on_dataset_id  (dataset_id)
#
require 'test_helper'

class ReportTest < ActiveSupport::TestCase
  setup do
    @report = create(:report)
    @dataset = @report.dataset
  end

  test 'purge_files should remove all attached files, but keep records' do
    @report.purge_files!

    @report.reload
    @dataset.reload

    assert_equal @report.status, 'purged'

    assert_not @report.all_files_present?

    %w[metadata.csv files.csv kgrams.csv pairs.csv].each do |f|
      assert_raises ActiveRecord::RecordNotFound do
        @report.attachment_by_filename(f)
      end
    end

    assert_not @dataset.zipfile.attached?
  end

  test 'calling purge_files multiple times should not crash' do
    @report.purge_files!

    @report.reload
    @dataset.reload

    assert_equal @report.status, 'purged'

    @report.purge_files!

    assert_equal @report.status, 'purged'
  end
end
