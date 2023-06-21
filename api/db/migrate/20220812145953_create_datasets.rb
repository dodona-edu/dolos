class CreateDatasets < ActiveRecord::Migration[7.0]
  def change
    create_table :datasets do |t|
      t.string :name
      t.string :programming_language
      t.integer :file_count

      t.timestamps
    end
  end
end
