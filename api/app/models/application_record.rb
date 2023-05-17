class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  # generate a random id for each model
  before_create :generate_id

  # since id's are generated randomly, we need this to make `.last` work again
  self.implicit_order_column = 'created_at'

  def generate_id
    begin
      # Rails uses BigInt by default for id's
      new = SecureRandom.random_number((2**32)..((2**63) - 1))
    end until !self.class.exists?(id: new)
    self.id = new
  end
end
