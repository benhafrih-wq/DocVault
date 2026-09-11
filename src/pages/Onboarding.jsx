import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useClinicProfile, CURRENCIES } from '@/lib/useClinic';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { data: existing, isLoading } = useClinicProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [clinicName, setClinicName] = useState('');
  const [currency, setCurrency] = useState('DZD');
  const [saving, setSaving] = useState(false);

  if (isLoading) return null;
  if (existing) return <Navigate to="/dashboard" replace />;

  const handleSave = async () => {
    if (!clinicName.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ClinicProfile.create({ clinic_name: clinicName.trim(), currency });
      await qc.invalidateQueries({ queryKey: ['clinicProfile'] });
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#006D77] flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">Welcome to MedTrack</h1>
            <p className="text-sm text-[#64748B]">Let's set up your clinic</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Clinic Name *</Label>
            <Input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g. Médéa Orthopedic & Joint Center"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Default Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c === 'DZD' ? 'DZD (DA)' : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !clinicName.trim()}
          className="w-full mt-6 bg-[#006D77] hover:bg-[#005a63] h-11"
        >
          {saving ? 'Setting up...' : 'Get Started'}
          {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}