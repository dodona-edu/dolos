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
require "test_helper"

class DatasetTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end

  setup do
    @dataset = datasets(:one)
    @dataset.zipfile.attach(io: File.open(Rails.root.join("test/files/simple-dataset.zip")),
                            filename: 'simple-dataset.zip')
  end

  test "should have zipfile attached" do
    assert @dataset.zipfile.attached?
  end

  test "should have metadata" do
    @dataset.zipfile.analyze
    assert @dataset.zipfile.analyzed?
    expected =  { "identified" => true,
                  "file_count" => 0,
                  "has_info_csv" => false,
                  "most_common_ext" => "js",
                  "most_common_ext_count" => 4,
                  "analyzed" => true
    }
    assert_equal expected, @dataset.zipfile.metadata
  end
end
