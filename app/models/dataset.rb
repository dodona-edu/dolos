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
require 'zip'

class Dataset < ApplicationRecord
  has_one_attached :zipfile

  validates :zipfile,
            attached: true,
            content_type: 'application/zip',
            size: { less_than: 10.megabytes }

end
