class DatasetsController < ApplicationController
  before_action :set_dataset, only: %i[ show analyze destroy ]

  # GET /datasets
  def index
    @datasets = Dataset.all

    render json: @datasets
  end

  # GET /datasets/1
  def show
    render json: @dataset
  end

  # POST /datasets
  def create
    @dataset = Dataset.new(dataset_params)
    if @dataset.save
      render json: @dataset, status: :created, location: @dataset
    else
      render json: @dataset.errors, status: :unprocessable_entity
    end
  end

  # POST /datasets/1/analyze
  def analyze
    @report = Report.new(dataset: @dataset)

    if @report.save
      render json: @report, status: :created, location: @report
    else
      render json: @report.errors, status: :unprocessable_entity
    end
  end

  # DELETE /datasets/1
  def destroy
    @dataset.destroy
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_dataset
      @dataset = Dataset.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def dataset_params
      params.require(:dataset).permit(:zipfile, :name, :programming_language)
    end
end
