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
#  token       :string(255)      not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  dataset_id  :bigint           not null
#
# Indexes
#
#  index_reports_on_dataset_id  (dataset_id)
#  index_reports_on_token       (token)
#
class Report < ApplicationRecord
  include Tokenable

  token_generator :token

  belongs_to :dataset

  RESULT_FILES = {
    "metadata.csv" => :metadata,
    "files.csv" => :files,
    "kgrams.csv" => :kgrams,
    "pairs.csv" => :pairs
  }.freeze

  has_one_attached :metadata
  has_one_attached :files
  has_one_attached :kgrams
  has_one_attached :pairs

  enum :status, { unknown: 0, queued: 1, running: 2, failed: 3, error: 4, finished: 5}

  before_create :generate_token
  after_create :queue_analysis

  def queue_analysis
    return if finished?

    self.update(status: :queued)
    AnalyzeDatasetJob.perform_later(self)
  end

  def all_files_present?
    RESULT_FILES.values.all?{ |attachment| self.send(attachment).attached? }
  end

  def attachment_by_filename(file)
    name = RESULT_FILES[file]
    if name.nil? || !self.send(name).attached?
      raise ActiveRecord::RecordNotFound.new('Result file not found')
    else
      self.send(name)
    end
  end

  def collect_files_from(result_dir)
    RESULT_FILES.map do |file, name|
      path = result_dir.join(file)
      next if !File.readable?(path)
      self.send(name).attach(
        io: File.open(path),
        filename: file,
        content_type: 'text/csv',
        identify: false
      )
    end
  end
end
