# Based on the Tokenable concern from Dodona
module Tokenable
  extend ActiveSupport::Concern

  class_methods do
    def token_generator(name, length: 16, unique: true)
      token_name = name.to_sym
      generate_token_method_name = "generate_#{name}".to_sym

      # Generate a random base64 string, but strip characters which might
      # look ambiguous.
      # We then check if the token still has the desired
      # length (base64 should generate a string with a length of 4/3 n, so
      # this should almost always be OK).
      # If the token needs to be unique, we also check if there is not a record
      # with the same token.
      define_method generate_token_method_name do
        begin
          new_token = SecureRandom.urlsafe_base64(length)
                                  .tr('1lL0oO', '')
                                  .slice(0, length)
        end until (new_token.length == length) && \
          !(unique && self.class.exists?(token_name => new_token))
        self[token_name] = new_token
      end
    end
  end
end
