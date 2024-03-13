# == Schema Information
#
# Table name: datasets
#
#  id                   :bigint           not null, primary key
#  file_count           :integer
#  name                 :string(255)
#  programming_language :string(255)
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
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
