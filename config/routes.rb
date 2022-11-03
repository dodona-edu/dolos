Rails.application.routes.draw do
  resources :reports, except: %i[update] do
    member do
      get 'data/:file', to: 'reports#data', as: 'data'
    end
  end
  resources :datasets, except: %i[update create] do
    member do
      post 'analyze'
    end
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
