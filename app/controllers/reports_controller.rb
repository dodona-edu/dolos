class ReportsController < ApplicationController
  before_action :set_report, only: %i[ show destroy ]

  # GET /reports
  def index
    @reports = Report.all

    render json: @reports
  end

  # GET /reports/1
  def show
    render json: @report
  end

  # DELETE /reports/1
  def destroy
    @report.destroy
  end

  # POST /reports
  def create
    @dataset = Dataset.new(dataset_params)
    @report = Report.new(dataset: @dataset)
    if @report.save
      render json: @report, status: :created, location: @report
    else
      render json: @report.errors, status: :unprocessable_entity
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_report
      @report = Report.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def report_params
      params.require(:report).permit(:dataset)
    end

    def dataset_params
      params.require(:dataset).permit(:zipfile, :name, :programming_language)
    end
end
