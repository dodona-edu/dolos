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
class DatasetSerializer < ApplicationSerializer
  attributes :token, :programming_language, :zipfile

  def zipfile
    url_for(object.zipfile)
  end
end
