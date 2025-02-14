import React, { useState, useEffect } from 'react';
import { DataTable } from './components/DataTable';
import { FileUpload } from './components/FileUpload';
import { CompanyData } from './types';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

function App() {
  const [data, setData] = useState<CompanyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<CompanyData[]>([]);

  useEffect(() => {
    fetchData();
    cleanupDuplicates();
    updateAllDates();
  }, []);

  useEffect(() => {
    const filtered = data.filter((item) => {
      const searchStr = searchQuery.toLowerCase();
      return Object.values(item).some(
        (value) => value && value.toString().toLowerCase().includes(searchStr)
      );
    });
    setFilteredData(filtered);
  }, [data, searchQuery]);

  const updateAllDates = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ date: '2025-02-14' });

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Tarih güncelleme hatası:', error);
    }
  };

  const cleanupDuplicates = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true });

      if (!companies) return;

      const createKey = (company: CompanyData) => 
        `${company.company_name}-${company.street}-${company.city}-${company.zip_code}-${company.country}`.toLowerCase();

      const uniqueMap = new Map<string, CompanyData>();
      const duplicateIds: string[] = [];
      
      companies.forEach(company => {
        const key = createKey(company);
        const existing = uniqueMap.get(key);
        
        if (!existing || new Date(company.created_at!) > new Date(existing.created_at!)) {
          if (existing) {
            duplicateIds.push(existing.id!);
          }
          uniqueMap.set(key, company);
        } else {
          duplicateIds.push(company.id!);
        }
      });

      if (duplicateIds.length > 0) {
        const { error } = await supabase
          .from('companies')
          .delete()
          .in('id', duplicateIds);

        if (error) throw error;
        
        await fetchData();
      }
    } catch (error) {
      console.error('Duplicate temizleme hatası:', error);
    }
  };

  const fetchData = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(companies || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error fetching data');
    }
  };

  const isDuplicate = (newData: CompanyData) => {
    return data.some(existing => 
      existing.company_name === newData.company_name &&
      existing.street === newData.street &&
      existing.city === newData.city &&
      existing.zip_code === newData.zip_code &&
      existing.country === newData.country
    );
  };

  const handleDataImport = async (newData: CompanyData[]) => {
    try {
      // Her yeni veri için duplicate kontrolü
      const duplicates = newData.filter(item => isDuplicate(item));
      if (duplicates.length > 0) {
        toast.error('Bu kayıt zaten sistemde mevcut!');
        return;
      }

      // Yeni kayıtlar için bugünün tarihini kullan
      const today = new Date().toISOString().split('T')[0];
      const dataWithDate = newData.map(item => ({
        ...item,
        date: today,
        email: item.email || '-'
      }));

      const { error } = await supabase
        .from('companies')
        .insert(dataWithDate);

      if (error) throw error;
      
      await fetchData();
      toast.success('Veri başarıyla eklendi!');
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Error importing data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[98%] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <img src="/olife_Logo.png" alt="O'life Logo" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              O'life Natural NV Label System
            </h1>
            <p className="text-gray-600 mt-1">
              Toplam Kayıt: {data.length}
            </p>
          </div>
        </div>
        
        <FileUpload onDataImport={handleDataImport} />
        
        <DataTable
          data={filteredData}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;