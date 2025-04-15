
import { useState, useEffect } from "react";
import { toast } from "sonner";
import MainLayout from "../components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { School } from "lucide-react";

interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  principalName: string;
  managerName: string;
}

const defaultSettings: SchoolSettings = {
  schoolName: "SMK GLOBIN",
  schoolAddress: "Jl. Cibeureum Tengah RT.06/01 Ds. Sinarsari",
  principalName: "Saepullah, S.Kom.",
  managerName: "Sari Maya, S.Pd., Gr.",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('schoolSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      }
    }
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('schoolSettings', JSON.stringify(settings));
    
    // Broadcast settings change to update all components
    window.dispatchEvent(new StorageEvent('storage', { key: 'schoolSettings' }));
    // Also trigger a custom event for same-tab updates
    window.dispatchEvent(new Event('storageUpdated'));
    
    toast.success("Pengaturan berhasil disimpan");
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold animate-fade-in">Pengaturan</h1>
          <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Konfigurasi informasi sekolah dan unit produksi
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center mb-4">
            <School className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">Informasi Sekolah</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="schoolName" className="block text-sm font-medium">
                  Nama Sekolah
                </label>
                <input
                  id="schoolName"
                  name="schoolName"
                  value={settings.schoolName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                  placeholder="Nama sekolah"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Akan ditampilkan dengan format: UP - {settings.schoolName}
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="schoolAddress" className="block text-sm font-medium">
                  Alamat Sekolah
                </label>
                <input
                  id="schoolAddress"
                  name="schoolAddress"
                  value={settings.schoolAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                  placeholder="Alamat sekolah"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="principalName" className="block text-sm font-medium">
                  Nama Kepala Sekolah
                </label>
                <input
                  id="principalName"
                  name="principalName"
                  value={settings.principalName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                  placeholder="Nama kepala sekolah"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="managerName" className="block text-sm font-medium">
                  Nama Pengelola Unit Produksi
                </label>
                <input
                  id="managerName"
                  name="managerName"
                  value={settings.managerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                  placeholder="Nama pengelola unit produksi"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" className="flex items-center">
                Simpan Pengaturan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
