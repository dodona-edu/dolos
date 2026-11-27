# Purges every report of Dolos 2, with its kgrams.csv file.
class PurgeDolos2Reports < ActiveRecord::Migration[8.1]
  def up
    Report.find_each(&:purge_files!)
    # Report no longer declares the kgrams attachment, so Report#purge_files! skips it.
    ActiveStorage::Attachment.where(record_type: 'Report', name: 'kgrams').find_each(&:purge)
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
