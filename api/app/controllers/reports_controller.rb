class ReportsController < ApplicationController
  before_action :set_report, only: %i[show destroy data]

  # GET /reports/1
  def show
    render json: @report
  end

  # POST /reports
  def create
    @report = Report.new(dataset_attributes: dataset_params)
    if @report.save
      render json: @report, status: :created, location: @report
    else
      render json: @report.errors, status: :unprocessable_entity
    end
  end

  # DELETE /reports/1
  def destroy
    @report.purge_files!
  end

  # GET /reports/:id/data/:file
  def data
    attachment = @report.attachment_by_filename("#{params[:file]}.#{params[:format]}")
    redirect_to rails_blob_path(attachment, disposition: 'attachment')
  rescue ActiveRecord::RecordNotFound
    render status: :not_found
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_report
    @report = Report.find(params[:id])
  end

  def dataset_params
    params.expect(dataset: %i[zipfile name programming_language])
  end
end
