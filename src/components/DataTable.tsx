import React from 'react';
import { CompanyData } from '../types';
import { Search } from 'lucide-react';

interface DataTableProps {
  data: CompanyData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DataTable({ data, searchQuery, onSearchChange }: DataTableProps) {
  const headers = [
    'Company Name',
    'Contact Name',
    'Street',
    'City',
    'State',
    'Country',
    'Zip Code',
    'Mobile Number',
    'Created At'
  ];

  // Boş değerleri - ile değiştiren yardımcı fonksiyon
  const formatValue = (value: string | null | undefined) => {
    if (!value || value === 'N/A') return '-';
    return value;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Herhangi bir kolonda ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-2 py-2 w-[8%]">Date</th>
              <th className="px-2 py-2 w-[14%]">Company Name</th>
              <th className="px-2 py-2 w-[10%]">Contact Name</th>
              <th className="px-2 py-2 w-[16%]">Street</th>
              <th className="px-2 py-2 w-[8%]">City</th>
              <th className="px-2 py-2 w-[6%]">State</th>
              <th className="px-2 py-2 w-[8%]">Country</th>
              <th className="px-2 py-2 w-[7%]">Zip Code</th>
              <th className="px-2 py-2 w-[10%]">Mobile Number</th>
              <th className="px-2 py-2 w-[13%]">Email</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                className="bg-white hover:bg-gray-50 transition-colors duration-150 ease-in-out"
              >
                <td className="px-2 py-2 border-t">{formatValue(row.date)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.company_name)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.contact_name)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.street)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.city)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.state)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.country)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.zip_code)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.mobile_number)}</td>
                <td className="px-2 py-2 border-t">{formatValue(row.email)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}