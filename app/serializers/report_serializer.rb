class ReportSerializer < ApplicationSerializer
  attributes :token, :error, :exit_status, :memory, :run_time, :status, :stderr, :stdout

  has_one :dataset
end
