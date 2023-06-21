Rails.application.configure do
  config.after_initialize do
    Delayed::Worker.destroy_failed_jobs = false # Keep failed jobs for logging
    Delayed::Worker.sleep_delay = 5 # seconds sleep if no job, default 5
    Delayed::Worker.max_attempts = 3 # default is 25
    Delayed::Worker.max_run_time = 10.minutes
    Delayed::Worker.read_ahead = 2 # default is 5
    Delayed::Worker.raise_signal_exceptions = :term # on kill release job
    Delayed::Worker.logger = Logger.new(Rails.root.join('log/delayed_job.log'))
    Delayed::Worker.default_queue_name = 'default'

    Delayed::Backend::ActiveRecord.configure do |config|
      config.reserve_sql_strategy = :default_sql
    end
  end
end
