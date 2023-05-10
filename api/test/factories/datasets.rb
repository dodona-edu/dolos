# == Schema Information
#
# Table name: datasets
#
#  id                   :bigint           not null, primary key
#  file_count           :integer
#  name                 :string(255)
#  programming_language :string(255)
#  token                :string(255)      not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#
# Indexes
#
#  index_datasets_on_token  (token)
#
FactoryBot.define do
  factory :dataset do
    name { Faker::Lorem.words(number: 3).join(' ') }
    zipfile do
      {
        io: Rails.root.join('test/files/simple-dataset.zip').open,
        filename: 'simple-dataset.zip',
        content_type: 'application/zip'
      }
    end
  end
end
