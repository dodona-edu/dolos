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

class Dataset < ApplicationRecord
  include Tokenable

  token_generator :token

  has_one_attached :zipfile
  has_many :reports, dependent: :destroy

  validates :zipfile,
            attached: true,
            content_type: 'application/zip',
            size: { less_than: 10.megabytes }

  before_create :generate_token

  def purge_files!
    return unless zipfile.attached?

    zipfile.purge
  end
end
