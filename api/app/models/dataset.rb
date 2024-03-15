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

  validates :name, presence: true, length: { minimum: 3, maximum: 255 }

  before_validation :ensure_name

  def purge_files!
    return unless zipfile.attached?

    zipfile.purge
  end

  private

  def ensure_name
    return unless zipfile.attached?

    self.name ||= zipfile.filename.base
  end
end
