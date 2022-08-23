class CreateReports < ActiveRecord::Migration[7.0]
  def change
    create_table :reports do |t|
      t.belongs_to :dataset, null: false
      t.integer :status
      t.text :error
      t.text :stdout
      t.text :stderr
      t.integer :exit_status
      t.integer :memory
      t.float :run_time
      t.timestamps
    end
  end
end
