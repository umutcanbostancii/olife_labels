export interface CompanyData {
  id?: string;
  date: string;
  company_name: string;
  contact_name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  mobile_number: string;
  email: string;
  created_at?: string;
}

export interface SearchFilters {
  query: string;
}