import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsManagement: React.FC = () => {
  // track which panel is open
  const [openPanel, setOpenPanel] = useState<'general'|'auth'|'payments'|null>(null);

  // form state
  const [general, setGeneral] = useState({ siteName: '', currency: 'USD', timezone: '' });
  const [auth, setAuth] = useState({ require2FA: false, minPasswordLength: 8 });
  const [payments, setPayments] = useState({ stripeKey: '', paypalKey: '', taxRate: 0 });

  const toggle = (panel: typeof openPanel) => {
    setOpenPanel(openPanel === panel ? null : panel);
  };

  const handleSave = (section: string) => {
    // TODO: write to Firebase under e.g. /settings/<section>
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} saved!`);
  };

  return (
    <div className="space-y-4">
      {/* GENERAL */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <button
          onClick={() => toggle('general')}
          className="w-full flex justify-between items-center px-6 py-4">
          <span className="font-medium">General Settings</span>
          {openPanel === 'general' ? <ChevronUp/> : <ChevronDown />}
        </button>
        {openPanel === 'general' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <input
                type="text"
                value={general.siteName}
                onChange={e => setGeneral({...general, siteName: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={general.currency}
                onChange={e => setGeneral({...general, currency: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <input
                type="text"
                placeholder="e.g. Asia/Kolkata"
                value={general.timezone}
                onChange={e => setGeneral({...general, timezone: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <button
              onClick={() => handleSave('general')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save General
            </button>
          </div>
        )}
      </div>

      {/* AUTHENTICATION */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <button
          onClick={() => toggle('auth')}
          className="w-full flex justify-between items-center px-6 py-4">
          <span className="font-medium">Authentication</span>
          {openPanel === 'auth' ? <ChevronUp/> : <ChevronDown />}
        </button>
        {openPanel === 'auth' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={auth.require2FA}
                onChange={e => setAuth({...auth, require2FA: e.target.checked})}
              />
              <label className="text-sm">Require 2-Factor Authentication</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min. Password Length</label>
              <input
                type="number"
                min={4}
                value={auth.minPasswordLength}
                onChange={e => setAuth({...auth, minPasswordLength: +e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <button
              onClick={() => handleSave('authentication')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save Authentication
            </button>
          </div>
        )}
      </div>

      {/* PAYMENTS */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <button
          onClick={() => toggle('payments')}
          className="w-full flex justify-between items-center px-6 py-4">
          <span className="font-medium">Payments</span>
          {openPanel === 'payments' ? <ChevronUp/> : <ChevronDown />}
        </button>
        {openPanel === 'payments' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stripe API Key</label>
              <input
                type="text"
                value={payments.stripeKey}
                onChange={e => setPayments({...payments, stripeKey: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PayPal API Key</label>
              <input
                type="text"
                value={payments.paypalKey}
                onChange={e => setPayments({...payments, paypalKey: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={payments.taxRate}
                onChange={e => setPayments({...payments, taxRate: +e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <button
              onClick={() => handleSave('payments')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save Payments
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsManagement;
