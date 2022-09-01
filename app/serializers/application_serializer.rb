class ApplicationSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :created_at, :updated_at
end
