class DatasetSerializer < ApplicationSerializer
  attributes :token, :programming_language, :zipfile

  def zipfile
    url_for(object.zipfile)
  end
end
