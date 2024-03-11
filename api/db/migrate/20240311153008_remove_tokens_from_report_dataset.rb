class RemoveTokensFromReportDataset < ActiveRecord::Migration[7.1]
  def change
    remove_index :reports, :token
    remove_column :reports, :token

    remove_index :datasets, :token
    remove_column :datasets, :token
  end
end
