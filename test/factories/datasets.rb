FactoryBot.define do
  factory :dataset do
    name { Faker::Lorem.words(number: 3).join(' ') }
    programming_language { "javascript" }
    zipfile {
      {
        io: File.open(Rails.root.join('test', 'files', 'simple-dataset.zip')),
        filename: "simple-dataset.zip",
        content_type: 'application/zip',
      }
    }
  end
end
