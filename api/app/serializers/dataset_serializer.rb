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
class DatasetSerializer < ApplicationSerializer
  attributes :programming_language, :zipfile, :name

  def zipfile
    return if object.zipfile.blank?

    url_for(object.zipfile)
  end
end
