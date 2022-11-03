class ApplicationSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :created_at, :updated_at, :url, :id

  def url
    url_for(object)
  end

  def id
    object.id.to_s
  end
end
