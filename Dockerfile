# syntax=docker/dockerfile:1
FROM ruby:3.1
RUN apt-get update -qq && apt-get -y install mariadb-client
WORKDIR /dolos
COPY Gemfile /dolos/Gemfile
COPY Gemfile.lock /dolos/Gemfile.lock
RUN bundle install

EXPOSE 3000

# Configure the main process to run when running the image
CMD ["rails", "server", "-b", "0.0.0.0"]
