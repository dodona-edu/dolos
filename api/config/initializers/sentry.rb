if Rails.env.production? && Rails.application.credentials[:sentry_dsn].present?
  Sentry.init do |config|
    config.dsn = Rails.application.credentials[:sentry_dsn]
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    config.traces_sample_rate = 0.25

    # Set profiles_sample_rate to profile 100%
    # of sampled transactions.
    # We recommend adjusting this value in production.
    config.profiles_sample_rate = 0.25
  end
end
