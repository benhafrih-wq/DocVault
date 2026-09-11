import React, { useState, useEffect, useRef } from 'react';
import { usePatients, nextPatientCode } from '@/lib/useClinic';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';

export default function PatientSelect({ value, onChange }) {
  const { data: patients = [] } = usePatients();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = value?.patient_id ? patients.find((p) => p.id === value.patient_id) : null;

  const q = query.trim().toLowerCase();
  const matches = q
    ? patients.filter((p) => `${p.full_name} ${p.patient_code}`.toLowerCase().includes(q)).slice(0, 8)
    : patients.slice(0, 8);

  const exactMatch = q && patients.some((p) => p.full_name.toLowerCase() === q);

  const createAndSelect = async () => {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await base44.entities.Patient.create({
        full_name: name,
        patient_code: nextPatientCode(patients),
      });
      await qc.invalidateQueries({ queryKey: ['patients'] });
      setQuery('');
      setOpen(false);
      onChange({ patient_id: created.id, patient_name: name });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-1.5 relative" ref={wrapRef}>
      <Label>Patient Name *</Label>
      <Input
        value={selected ? `${selected.full_name} (${selected.patient_code})` : query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange({ patient_id: '', patient_name: '' });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type a patient name or ID…"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange({ patient_id: p.id, patient_name: p.full_name });
                setQuery('');
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between gap-2"
            >
              <span className="text-sm text-[#1E293B] truncate">{p.full_name}</span>
              <span className="text-xs text-[#006D77] font-semibold shrink-0">{p.patient_code}</span>
            </button>
          ))}
          {q && !exactMatch && (
            <button
              type="button"
              onClick={createAndSelect}
              disabled={creating}
              className="w-full text-left px-3 py-2.5 hover:bg-[#E0F2F1] text-sm text-[#006D77] font-semibold flex items-center gap-2 border-t border-gray-100"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Register “{query.trim()}” as New Patient
            </button>
          )}
          {!q && matches.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-[#64748B]">
              Type a name to search or register a new patient.
            </div>
          )}
        </div>
      )}
    </div>
  );
}