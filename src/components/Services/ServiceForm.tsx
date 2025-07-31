import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { mockCustomers, mockUsers } from '../../data/mockData';

interface ServiceFormProps {
  onClose: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    orderId: '',
    problemDescription: '',
    category: '',
    assignedTo: '',
    receptionPoint: '',
    underWarranty: false,
    relatedProducts: [],
    emailNotifications: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Service form data:', formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Klienti</label>
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Klientin</option>
            {mockCustomers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Porosia e Lidhur (Opsionale)</label>
          <input
            type="text"
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            placeholder="ORD001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi i Problemit</label>
        <textarea
          name="problemDescription"
          value={formData.problemDescription}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Kategorinë</option>
            <option value="Repair">Riparim</option>
            <option value="Replacement">Zëvendësim</option>
            <option value="Quality Issue">Problemi i Cilësisë</option>
            <option value="Installation">Instalim</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cakto Për</label>
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Teknici</option>
            {mockUsers.filter(user => user.role === 'Technician').map(user => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Produktet e Lidhura (Opsionale)</label>
        <textarea
          name="relatedProducts"
          placeholder="Vendosni produktet që janë lidhur me këtë kërkesë të shërbimit..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Punkti i Pranuesit</label>
          <select
            name="receptionPoint"
            value={formData.receptionPoint}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Punksin e Pranuesit</option>
            <option value="Ofice Përparëse">Ofice Përparëse</option>
            <option value="Depo">Depo</option>
            <option value="Qendrë Shërbimi">Qendrë Shërbimi</option>
          </select>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="underWarranty"
              checked={formData.underWarranty}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Produkti në garanci</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Dërgo notifikime në email</label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Shtesa (Opsionale)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Kliko për të ngarkuar skedarë apo ngjitni dhe lëshoni</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF deri në 10MB</p>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => console.log('Files selected:', e.target.files)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Anulo
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Krijo Shërbim
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;