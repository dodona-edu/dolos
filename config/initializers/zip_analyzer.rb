require 'zip'

class ZipAnalyzer < ActiveStorage::Analyzer
  def self.accept?(blob)
    blob.content_type == "application/zip"
  end

  def metadata
    process
  end

  private

  def process
    @meta ||= download_blob_to_tempfile { |file| process_from(file) }
  end

  def process_from(file)
    file_count = 0
    has_info_csv = false
    files_by_ext = Hash.new(0)
    Zip::File.open(file.path) do |zip_file|
      zip_file.entries.each do |entry|
        if entry.ftype == :file
          file_count += 1
          if entry.name == "info.csv"
            has_info_csv = true
          else
            parts = entry.name.split('.')
            if parts.size > 1
              files_by_ext[parts.last] += 1
            end
          end
        end
      end
    end
    most_common_ext, most_common_ext_count = files_by_ext.max_by{ |_ext, count| count }
    {
      file_count:,
      has_info_csv:,
      most_common_ext:,
      most_common_ext_count:
    }
  end
end


# ActiveStorage has a default protocol of extracting metadata from attachments,
# we built our own to analyze zip files to extract useful information from them
# (e.g. number of files, whether an info.csv is present, most common extension, ...)
Rails.application.config.active_storage.analyzers.append ZipAnalyzer
