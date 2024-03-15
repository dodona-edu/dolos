class DatasetsController < ApplicationController
  before_action :set_dataset, only: %i[show]

  # GET /datasets/1
  def show
    render json: @dataset
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_dataset
    @dataset = Dataset.find(params[:id])
  end
end
