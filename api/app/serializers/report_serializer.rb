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
class ReportSerializer < ApplicationSerializer
  attributes :error, :exit_status, :status, :stderr, :stdout, :name, :html_url

  has_one :dataset
end
