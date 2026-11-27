require 'test_helper'
require Rails.root.join('db/migrate/20261127081431_purge_dolos2_reports')

class PurgeDolos2ReportsTest < ActiveSupport::TestCase
  test 'should purge the reports and their kgrams files' do
    report = create(:report)
    kgrams = ActiveStorage::Blob.create_and_upload!(io: StringIO.new('id,hash,data,files'), filename: 'kgrams.csv')
    ActiveStorage::Attachment.create!(name: 'kgrams', record: report, blob: kgrams)

    PurgeDolos2Reports.new.up

    assert_predicate report.reload, :purged?
    assert_not report.dataset.zipfile.attached?
    assert_not ActiveStorage::Blob.exists?(kgrams.id)
  end
end
