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
FactoryBot.define do
  factory :report do
    status { :finished }
    dataset

    metadata do
      {
        io: File.open(Rails.root.join('test', 'files', 'simple-dataset-results', 'metadata.csv')),
        filename: 'metadata.csv',
        content_type: 'text/csv'
      }
    end

    pairs do
      {
        io: File.open(Rails.root.join('test', 'files', 'simple-dataset-results', 'pairs.csv')),
        filename: 'pairs.csv',
        content_type: 'text/csv'
      }
    end

    files do
      {
        io: File.open(Rails.root.join('test', 'files', 'simple-dataset-results', 'files.csv')),
        filename: 'files.csv',
        content_type: 'text/csv'
      }
    end

    kgrams do
      {
        io: File.open(Rails.root.join('test', 'files', 'simple-dataset-results', 'kgrams.csv')),
        filename: 'kgrams.csv',
        content_type: 'text/csv'
      }
    end
  end
end
