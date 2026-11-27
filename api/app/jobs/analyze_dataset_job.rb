require 'docker'

# Creates a report by analyzign an input dataset using the Dolos dockerfile
#
# This is largely based on Dodona's SubmissionRunner
class AnalyzeDatasetJob < ApplicationJob
  queue_as :default

  TMPDIR_PATH = '/tmp'.freeze
  OUTPUT_DIRNAME = 'result'.freeze
  DOLOS_IMAGE = 'ghcr.io/dodona-edu/dolos-cli:latest'.freeze
  TIMEOUT = 60.seconds
  MEMORY_LIMIT = 2_000_000_000
  OUTPUT_LIMIT = 65_000

  def perform(report, **options)
    @report  = report
    @options = options

    @dataset = report.dataset
    @mac = RUBY_PLATFORM.include?('darwin')

    prepare
    @dataset.zipfile.open do |zipfile_tmp|
      execute(zipfile_tmp.path)
    end
  rescue StandardError => e
    @report.update(
      status: 'error',
      error: truncate("Error while running Docker: #{e}\n" + e.backtrace.join("\n"))
    )
  ensure
    finalize
  end

  private

  def prepare
    @report.update(status: 'running')

    @mount = Pathname.new Dir.mktmpdir(nil, @mac ? TMPDIR_PATH : nil)
    @output_dir = @mount.join(OUTPUT_DIRNAME)
  end

  def execute(zipfile_path)
    cmd = [
      '-V', # enable verbose errors
      '-f', 'csv',
      '-o', OUTPUT_DIRNAME,
      '-n', @dataset.name,
      '/input.zip'
    ]
    cmd += ['-l', @dataset.programming_language] if @dataset.programming_language.present?
    docker_options = {
      Cmd: cmd,
      User: Process.euid.to_s,
      Image: DOLOS_IMAGE,
      name: "dolos-#{@report.id}",
      NetworkDisabled: true,
      HostConfig: {
        Memory: MEMORY_LIMIT,
        MemorySwap: MEMORY_LIMIT,
        PidsLimit: -1,
        Binds: [
          "#{zipfile_path}:/input.zip:ro",
          "#{@mount}:/dolos"
        ]
      }
    }

    first_try = true
    begin
      container = Docker::Container.create(**docker_options)
    rescue StandardError => e
      # Rethrow if this is our second try
      throw e unless first_try

      first_try = false
      sleep 1
      # Create can fail due to timeouts if the worker is under heavy
      # load. Usually the container is still created, but we just
      # don't know about it in time. Make sure the old container is
      # deleted before we retry creating it to avoid name conflicts.
      begin
        Docker::Container.get(docker_options[:name]).tap do |c|
          c.stop
          c.remove
        end
      # rubocop:disable Lint/SuppressedException
      # If the container does not exist the library raises an
      # error. We can ignore this error, since we can skip the
      # previous step anyway in that case.
      rescue StandardError
      end
      # rubocop:enable Lint/SuppressedException
      # We also still change the name, because the removal can fail as well.
      docker_options[:name] = "dolos-#{@report.id}-retry"
      retry
    end

    # run the container with a timeout.
    memory = 0
    before_time = Time.zone.now
    timeout_mutex = Mutex.new
    timeout = nil

    timer = Thread.new do
      while Time.zone.now - before_time < TIMEOUT
        sleep 1
        next if Rails.env.test?
        # Check if container is still alive
        next unless Docker::Container.all.any? { |c| c.id.starts_with?(container.id) || container.id.starts_with?(container.id) } && container.refresh!.info['State']['Running']

        stats = container.stats
        # We check the maximum memory usage every second. This is obviously monotonic, but these stats aren't available after the container is/has stopped.
        memory = stats['memory_stats']['max_usage'] / (1024.0 * 1024.0) if stats['memory_stats']&.fetch('max_usage', nil)
      end
      timeout_mutex.synchronize do
        container.stop
        timeout = true if timeout.nil?
      end
    end

    begin
      outlines, errlines = container.tap(&:start).attach(
        stdout: true,
        stderr: true
      )
    ensure
      timeout_mutex.synchronize do
        timer.kill
        timeout = false if timeout.nil?
      end
    end

    after_time = Time.zone.now
    stdout = truncate(outlines.join.force_encoding('utf-8'))
    stderr = truncate(errlines.join.force_encoding('utf-8'))
    exit_status = container.wait(1)['StatusCode']
    container.delete

    @report.update(
      stdout: stdout,
      stderr: stderr,
      exit_status: exit_status,
      memory: memory,
      run_time: (after_time - before_time)
    )

    @report.collect_files_from(@output_dir)

    if exit_status == 137
      @report.update(status: 'failed', error: 'out-of-memory')
    elsif exit_status != 0
      @report.update(status: 'failed', error: 'non-zero exit code')
    elsif !@report.all_files_present?
      @report.update(status: 'failed', error: 'some output files missing')
    else
      @report.update(status: 'finished')
    end
  end

  def finalize
    # remove path on file system used as temporary working directory for analyzing the dataset
    FileUtils.remove_entry_secure(@mount)
    @mount = nil
  end

  def truncate(string)
    max = OUTPUT_LIMIT
    string.length > max ? "#{string[0...max]}... (truncated)" : string
  end
end
