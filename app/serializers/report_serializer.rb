class ReportSerializer < ApplicationSerializer
  attributes :id, :token, :error, :exit_status, :memory, :run_time, :status, :stderr, :stdout

  has_one :dataset
end
