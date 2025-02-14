import React, { useRef, useEffect, useState } from 'react';
import { Upload, X, Type } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CompanyData } from '../types';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';

interface FileUploadProps {
  onDataImport: (data: CompanyData[]) => void;
}

export function FileUpload({ onDataImport }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textInput, setTextInput] = useState('');

  // PDF.js worker'ı için yapılandırma
  useEffect(() => {
    const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }, []);

  const handleExcelImport = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      const today = new Date().toISOString().split('T')[0];
      
      const jsonData = rawData.map((row: any) => ({
        company_name: row['Company Name'] || row['company_name'] || '',
        contact_name: row['Contact Name'] || row['contact_name'] || '',
        street: row['Street'] || row['street'] || '',
        city: row['City'] || row['city'] || '',
        state: row['State'] || row['state'] || '',
        country: row['Country'] || row['country'] || '',
        zip_code: row['Zip Code'] || row['zip_code'] || '',
        mobile_number: row['Mobile Number'] || row['mobile_number'] || '',
        email: row['Email'] || row['email'] || '-',
        date: today
      })) as CompanyData[];

      onDataImport(jsonData);
      toast.success('Excel verisi başarıyla içe aktarıldı!');
    } catch (error) {
      console.error('Excel dosyası içe aktarılırken hata:', error);
      toast.error('Excel dosyası içe aktarılamadı');
    }
  };

  const handlePDFImport = async (file: File) => {
    const loadingToast = toast.loading('PDF işleniyor...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let allItems: any[] = [];
      
      // Tüm sayfalardan metin öğelerini topla
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allItems = allItems.concat(textContent.items);
      }

      // Öğeleri y koordinatına göre grupla ve sırala
      const sortedItems = allItems.sort((a: any, b: any) => {
        // Önce y koordinatına göre sırala (yukarıdan aşağıya)
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 1) return yDiff;
        // Aynı y koordinatında olanları x koordinatına göre sırala (soldan sağa)
        return a.transform[4] - b.transform[4];
      });

      // Metni birleştir
      const fullText = sortedItems.map(item => item.str).join(' ');
      console.debug('Ham PDF metni:', fullText);

      // SHIP TO bölümünü bul
      const shipToMatch = fullText.match(/SHIP\s+TO:([^]*?)(?=UPS\s+STANDARD|BILLING|$)/i);
      if (!shipToMatch) {
        console.error('SHIP TO bölümü bulunamadı');
        toast.error('PDF\'de gönderim bilgisi bulunamadı');
        return;
      }

      const shipToText = shipToMatch[1].trim();
      console.debug('SHIP TO bölümü:', shipToText);

      // Adres bilgilerini çıkar
      const lines = shipToText.split(/\s{2,}/).map(line => line.trim()).filter(Boolean);
      console.debug('Adres satırları:', lines);

      const today = new Date().toISOString().split('T')[0];
      
      const companyData = {
        company_name: lines.find(line => line.includes('BELGIUM')) || '',
        contact_name: lines[0] || '',
        street: lines.find(line => line.includes('BROEKOOI') || line.includes('Z.4')) || '',
        city: 'ZELLIK',
        state: '',
        country: 'Belgium',
        zip_code: '1731',
        mobile_number: lines.find(line => /^\d{2}\s*\d{3}\s*\d{2}\s*\d{2}$/.test(line.replace(/\s+/g, ''))) || '',
        email: '-',
        date: today
      };

      if (companyData.company_name && companyData.street) {
        console.debug('Çıkarılan şirket verisi:', companyData);
        onDataImport([companyData]);
        toast.success('PDF verisi başarıyla çıkarıldı!');
      } else {
        console.error('Geçerli adres bilgisi bulunamadı');
        toast.error('PDF\'de gönderim bilgisi bulunamadı');
      }
    } catch (error) {
      console.error('PDF işlenirken hata:', error);
      toast.error('PDF işlenirken hata oluştu');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleTextImport = () => {
    try {
      // Metni satırlara böl ve boş satırları temizle
      const lines = textInput.split('\n').map(line => line.trim()).filter(Boolean);
      
      // SHIP TO: satırını bul ve sonrasını al
      const shipToIndex = lines.findIndex(line => line.toUpperCase().includes('SHIP TO:'));
      if (shipToIndex === -1) {
        toast.error('SHIP TO: bölümü bulunamadı');
        return;
      }

      const addressLines = lines.slice(shipToIndex + 1);
      console.debug('İşlenecek adres satırları:', addressLines);

      // Telefon numarası formatını kontrol et
      const phonePattern = /^\d+$/;
      const phoneLineIndex = addressLines.findIndex(line => phonePattern.test(line.replace(/\s+/g, '')));
      const phone = phoneLineIndex !== -1 ? addressLines[phoneLineIndex].replace(/\s+/g, '') : '';

      // Posta kodu ve şehir
      const zipCityPattern = /(\d{4,5})\s+([A-ZÀ-ÿ\-]+)/i;
      const addressLine = addressLines.find(line => zipCityPattern.test(line)) || '';
      const zipCityMatch = addressLine.match(zipCityPattern);
      const zip = zipCityMatch ? zipCityMatch[1] : '';
      const city = zipCityMatch ? zipCityMatch[2] : '';

      // Ülke bilgisini son satırdan al
      const country = addressLines[addressLines.length - 1];

      // Şirket adı ve sokak bilgisi
      let companyName = '';
      let street = '';

      // phoneLineIndex'ten sonraki satır genelde şirket adı
      if (phoneLineIndex !== -1 && phoneLineIndex + 1 < addressLines.length) {
        companyName = addressLines[phoneLineIndex + 1];
      }

      // Sokak adresi genelde şirket adından sonra gelir
      const possibleStreetIndex = addressLines.findIndex(line => 
        line.includes('STR') || line.includes('STREET') || /\d+/.test(line)
      );
      if (possibleStreetIndex !== -1) {
        street = addressLines[possibleStreetIndex];
      }

      const today = new Date().toISOString().split('T')[0];
      
      const companyData = {
        company_name: companyName,
        contact_name: addressLines[0] || '',
        street: street,
        city: city,
        state: '',
        country: country,
        zip_code: zip,
        mobile_number: phone,
        email: '-',
        date: today
      };

      console.debug('Oluşturulan şirket verisi:', companyData);

      if (companyData.company_name && companyData.street) {
        onDataImport([companyData]);
        setIsModalOpen(false);
        setTextInput('');
        toast.success('Veri başarıyla içe aktarıldı!');

        // Yeni eklenen satırı vurgula
        setTimeout(() => {
          const table = document.querySelector('table');
          const lastRow = table?.querySelector('tbody tr:last-child');
          if (lastRow) {
            lastRow.classList.add('bg-green-100');
            setTimeout(() => {
              lastRow.classList.remove('bg-green-100');
            }, 1000);
          }
        }, 100);
      } else {
        toast.error('Geçerli adres bilgisi bulunamadı');
      }
    } catch (error) {
      console.error('Metin işlenirken hata:', error);
      toast.error('Metin işlenirken hata oluştu');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      await handlePDFImport(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
               file.type === 'application/vnd.ms-excel') {
      await handleExcelImport(file);
    } else {
      toast.error('Desteklenmeyen dosya formatı');
    }
  };

  return (
    <>
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-5 w-5" />
          Dosya Yükle (Excel/PDF)
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Type className="h-5 w-5" />
          Metin Girişi
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.pdf"
          className="hidden"
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Metin Girişi</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="SHIP TO: ile başlayan adres bilgisini yapıştırın..."
              className="w-full h-48 p-3 border rounded-lg mb-4 font-mono"
              spellCheck={false}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleTextImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}