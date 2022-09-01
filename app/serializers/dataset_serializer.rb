class DatasetSerializer < ApplicationSerializer
  attributes :id, :token, :programming_language

  attribute :zipfile do
    {
      href: url_for(object.zipfile)
    }
  end
end
