Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  resources :reports, except: %i[index update] do
    member do
      get 'data/:file', to: 'reports#data', as: 'data'
    end
  end

  resources :datasets, only: %i[show]

  get "up" => "rails/health#show"

  # Defines the root path route ("/")
  # root "articles#index"
end
