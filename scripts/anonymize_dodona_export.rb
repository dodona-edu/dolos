#!/usr/bin/env ruby
require 'net/http'
require 'csv'
require 'json'
require 'fileutils'

$export_dir = 'telefoonboekcodering/'
$pseudo_name_file = 'ikea-names.txt'
$anonymised_dir = 'anonymized/'

$dodona_token = ''
$submissions_uri = URI('https://dodona.ugent.be/submissions/')

# random seed used to shuffle names
$seed = 890678
$rand = Random.new($seed)

# names who will be fitlered out
$admins = [
  "Caroline De Tender",
  "Arne Jacobs",
  "Frederik Mortier",
  "Niels Neirynck",
  "Peter Dawyndt",
  "Dieter Mourisse",
  "Wouter Saelens",
  "Annick Van Daele",
  "Rien Maertens"
]

$pseudo_names = File.read($pseudo_name_file).lines.map(&:strip).shuffle

def fetch(http, id)
  uri = $submissions_uri + "#{id}.json"
  get = Net::HTTP::Get.new(uri)
  get["Authorization"] = $dodona_token
  response = http.request(get)
  JSON.parse(response.body)
end

FileUtils.mkdir_p($anonymised_dir)

Net::HTTP.start($submissions_uri.hostname, $submissions_uri.port, use_ssl: true) do |http|
  CSV.open($anonymised_dir + 'info.csv', "wb") do |csv|
    csv << ["name", "filename", "status", "date"]
    CSV.foreach($export_dir + 'info.csv', headers: true).zip($pseudo_names) do |row, pseudoname|
      if $admins.include?(row["full_name"])
        puts "Ignoring " + $export_dir + row["filename"]
      else
        submission = fetch(http, row["submission_id"])
        status = submission["status"]
        date = submission["created_at"]

        src = $export_dir + row["filename"]
        dest = $anonymised_dir + pseudoname + '.py'

        puts "Renaming #{src} => #{dest}"
        FileUtils.cp($export_dir + row["filename"], dest)

        csv << [ pseudoname, dest, status, date ]
      end
    end
  end
end

