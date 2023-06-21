class AddTokensToReportAndDataset < ActiveRecord::Migration[7.0]
  def change
    add_column :reports, :token, :string, unique: true, null: false
    add_index :reports, :token

    add_column :datasets, :token, :string, unique: true, null: false
    add_index :datasets, :token
  end
end
