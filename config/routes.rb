Rails.application.routes.draw do
  resources :reports, except: %i[update]
  resources :datasets, except: %i[update create] do
    member do
      post 'analyze'
    end
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
