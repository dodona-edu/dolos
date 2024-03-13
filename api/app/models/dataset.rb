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

class Dataset < ApplicationRecord
  MAX_ZIP_SIZE = 10.megabytes

  has_one_attached :zipfile
  has_many :reports, dependent: :destroy

  validates :zipfile,
            attached: true,
            content_type: 'application/zip',
            size: { less_than: MAX_ZIP_SIZE }

  def purge_files!
    return unless zipfile.attached?

    zipfile.purge
  end
end
