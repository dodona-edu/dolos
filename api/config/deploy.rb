# config valid for current version and patch releases of Capistrano
lock "~> 3.18"

set :application, "dolos"
set :repo_url, "git@github.com:dodona-edu/dolos.git"
set :repo_tree, "api"

# Default branch is :master
# ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp
set :branch, ENV['GITHUB_SHA'] || 'main'

# Default deploy_to directory is /var/www/my_app_name
set :deploy_to, "/home/dodona/dolos/api"

# RVM is installed globally using apt
set :rvm_custom_path, '/usr/share/rvm'

# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: "log/capistrano.log", color: :auto, truncate: :auto

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
append :linked_files, 'config/master.key'

# Default value for linked_dirs is []
append :linked_dirs, "log", "tmp/pids", "tmp/cache", "tmp/sockets", "tmp/webpacker", "public/system", "vendor", "storage"

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for local_user is ENV['USER']
# set :local_user, -> { `git config user.name`.chomp }

# Default value for keep_releases is 5
# set :keep_releases, 5

# Uncomment the following to require manually verifying the host key before first deploy.
# set :ssh_options, verify_host_key: :secure
#
# Number of delayed_job workers
# default value: 1
# set :delayed_job_workers, 5
set :delayed_job_roles, [:worker]
