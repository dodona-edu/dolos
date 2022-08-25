source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "3.1.2"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 7.0.3"

# Use mysql as the database for Active Record
gem "mysql2", "~> 0.5"

# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 5.0"

# Process ZIP archives
gem "rubyzip", "~> 2.3"

# Validate ActiveStorage attachments
gem "active_storage_validations", "~> 0.9"

# interfacing with docker
gem 'docker-api', '~> 2.2.0'

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ mingw mswin x64_mingw jruby ]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Use Delayed Job for background jobs
gem "delayed_job_active_record"

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri mingw x64_mingw ]

  # Factory bot for testing factories
  gem "factory_bot_rails", "~> 6.2.0"

  # Faker for generating test data
  gem "faker", "~> 2.22.0"
end

group :development do
  # Speed up commands on slow machines / big apps [https://github.com/rails/spring]
  # gem "spring"
  gem 'annotate', '~> 3.2' # Remove workaround in lib/tasks/annotate.rb when https://github.com/ctran/annotate_models/issues/696 is fixed
  gem 'rubocop-minitest', '~> 0.21.0'
  gem 'rubocop-rails', '~> 2.15'
end

