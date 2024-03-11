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
require 'test_helper'

class DatasetTest < ActiveSupport::TestCase
  setup do
    @dataset = create(:dataset)
  end

  test 'should have zipfile attached' do
    assert @dataset.zipfile.attached?
  end

  test 'should have metadata' do
    @dataset.zipfile.analyze
    assert @dataset.zipfile.analyzed?
    expected = { 'identified' => true,
                 'file_count' => 5,
                 'has_info_csv' => true,
                 'most_common_ext' => 'js',
                 'most_common_ext_count' => 4,
                 'analyzed' => true }
    assert_equal expected, @dataset.zipfile.metadata
  end
end
