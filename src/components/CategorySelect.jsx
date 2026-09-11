import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { INCOME_CATEGORIES, SURGICAL_CATEGORIES, EXPENSE_CATEGORIES, useCustomCategories } from '@/lib/useClinic';

const PRESETS = {
  income: INCOME_CATEGORIES,
  surgical: SURGICAL_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
};

export default function CategorySelect({ mode, value, onChange, resetKey }) {
  const { data: customs = [] } = useCustomCategories(mode);
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    setCustomMode(false);
  }, [resetKey, mode]);

  const presets = PRESETS[mode] || [];
  const allOptions = [...new Set([...presets, ...customs.map((c) => c.name)])];

  const onSelect = (v) => {
    if (v === '__add_custom__') {
      setCustomMode(true);
      onChange('');
    } else {
      setCustomMode(false);
      onChange(v);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>Category *</Label>
      <Select value={customMode ? '' : value} onValueChange={onSelect}>
        <SelectTrigger><SelectValue placeholder={customMode ? 'Custom category…' : undefined} /></SelectTrigger>
        <SelectContent>
          {allOptions.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
          <SelectItem value="__add_custom__">
            <span className="flex items-center gap-1.5 text-[#006D77] font-semibold">
              <Plus className="w-3.5 h-3.5" /> Other (Add Custom Category)
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {customMode && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a custom category name"
          autoFocus
        />
      )}
    </div>
  );
}
