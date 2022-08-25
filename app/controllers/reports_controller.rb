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

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_report
      @report = Report.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def report_params
      params.require(:report).permit(:dataset)
    end
end
