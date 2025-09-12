import React, { useState, useEffect } from 'react';
import { apiCall, apiConfig } from '../../config/api';

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  user?: any; // For editing existing user
}

const UserForm: React.FC<UserFormProps> = ({ onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Agjent mbështetje',
    phone: user?.phone || '',
    password: '' // Only for new users
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (user) {
        // Update existing user
        await apiCall(`${apiConfig.endpoints.users}/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone
          })
        });
      } else {
        // Create new user
        await apiCall(apiConfig.endpoints.users, {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone,
            password: formData.password
          })
        });
      }
      
      onSuccess?.();
      if (user) {
        alert('Përdoruesi u përditësua me sukses');
      } else {
        alert('Përdoruesi u shtua me sukses');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gabim në ruajtjen e përdoruesit');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="username"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {!user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fjalëkalimi</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={!user}
            minLength={6}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefoni</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+383 44 123 456"
        />
      </div>


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Roli</label>
        <select 
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Zgjidh Rolin</option>
          <option value="Administrator">Administrator</option>
          <option value="Menaxher">Menaxher</option>
          <option value="Marketer">Marketer</option>
          <option value="Dizajner">Dizajner</option>
          <option value="Agjent shitjeje">Agjent shitjeje</option>
          <option value="Agjent mbështetje">Agjent mbështetje</option>
          <option value="Serviser">Serviser</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
        >
          Anulo
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Duke ruajtur...' : (user ? 'Përditëso' : 'Krijo Përdorues')}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
