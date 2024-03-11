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
FactoryBot.define do
  factory :report do
    status { :finished }
    dataset

    metadata do
      {
        io: Rails.root.join('test/files/simple-dataset-results/metadata.csv').open,
        filename: 'metadata.csv',
        content_type: 'text/csv'
      }
    end

    pairs do
      {
        io: Rails.root.join('test/files/simple-dataset-results/pairs.csv').open,
        filename: 'pairs.csv',
        content_type: 'text/csv'
      }
    end

    files do
      {
        io: Rails.root.join('test/files/simple-dataset-results/files.csv').open,
        filename: 'files.csv',
        content_type: 'text/csv'
      }
    end

    kgrams do
      {
        io: Rails.root.join('test/files/simple-dataset-results/kgrams.csv').open,
        filename: 'kgrams.csv',
        content_type: 'text/csv'
      }
    end
  end
end
