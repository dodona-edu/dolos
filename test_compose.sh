#!/usr/bin/env sh
set -e

# This script tests the Docker Compose setup of docker-compose.yml.
# It builds the images from this repository, starts Dolos on http://localhost and analyzes a sample dataset.

PROJECT_NAME="dolos-test"
ENV_FILE="$(mktemp)"

# The secrets of .env.example are empty: generate them.
sed \
  -e "s/^DOLOS_VERSION=.*/DOLOS_VERSION=test/" \
  -e "s/^DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$(openssl rand -hex 32)/" \
  -e "s/^SECRET_KEY_BASE=.*/SECRET_KEY_BASE=$(openssl rand -hex 64)/" \
  .env.example > "$ENV_FILE"

compose() {
  docker compose -p "$PROJECT_NAME" --env-file "$ENV_FILE" "$@"
}

cleanup() {
  compose down --volumes
  rm -f "$ENV_FILE"
}
trap cleanup EXIT

compose down --volumes
compose build
compose up --wait --detach

echo "Load the frontend"
curl -s --fail http://localhost/ > /dev/null

echo "Upload zipfile"

report_url="$(
  curl -s --fail \
    --form "dataset[name]=Example" \
    --form "dataset[zipfile]=@./samples/javascript/simple-dataset.zip" \
    http://localhost/reports \
    | jq -r '.url'
    )"


echo "Polling $report_url until finished or failed"

while sleep 1; do
  report_json="$(curl -s --fail "$report_url")"
  report_status="$(printf "%s" "$report_json" | jq -r '.status')"
  echo "Status is '$report_status'"
  case "$report_status" in
    "queued" | "running")
      ;;
    "finished")
      break
      ;;
    *)
      echo "Something went wrong:"
      echo "$report_json"
      exit 1
      ;;
  esac
done

curl -s --location --fail "$report_url/data/pairs.csv"

echo "Everything is working as expected"
