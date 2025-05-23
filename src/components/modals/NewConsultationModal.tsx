'use client';

import React, { useEffect, useState, forwardRef } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Patient } from '@/lib/types';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PlusCircle, UserPlus, MagnifyingGlass, PlayCircle } from "@phosphor-icons/react";
import { supabaseDataService } from '@/lib/supabaseDataService';
import type { Admission } from '@/lib/types';

interface Props {
  /** Controls open state from parent */
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConsultationCreated?: (patient: Patient | null, newAdmission: Admission | null) => void;
}

// Custom DatePicker wrapper component
const StyledDatePicker = forwardRef<HTMLInputElement, any>(({ value, onClick, onChange, placeholderText, className, selected, ...props }, ref) => {
  // The input's own text (the selected date) should use text-step--1.
  // The placeholder text will be styled by global ::placeholder rules.
  const inputClassName = cn(
    "w-full px-3 py-2 border rounded-md bg-background text-step--1 font-sans focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    className // Allow overriding via prop
  );

  // If react-datepicker sets the value to the placeholderText when !selected,
  // we might need to style it. However, it usually uses a real placeholder attribute.
  const textStyle = selected ? {} : { 
    // Only apply if value itself is the placeholder, otherwise let ::placeholder handle it
    // This is a safety net, ideally not needed if placeholder attribute is used.
    // color: !value || value === placeholderText ? 'var(--placeholder-color)' : 'inherit',
    // opacity: !value || value === placeholderText ? 'var(--placeholder-opacity)' : 1,
  };

  return (
    // className from props is now applied to the input directly via inputClassName merge
    <div className="react-datepicker-wrapper" style={{ width: '100%' }}> 
      <DatePicker
        ref={ref}
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        {...props}
        customInput={<input value={value} onClick={onClick} onChange={onChange} placeholder={placeholderText} className={inputClassName} style={textStyle} />}
      />
    </div>
  );
});
StyledDatePicker.displayName = 'StyledDatePicker';

export default function NewConsultationModal({ open, onOpenChange, onConsultationCreated }: Props) {
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const router = useRouter();

  // Existing patients search
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New patient form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState<Date | null>(null);

  // Shared fields
  const [reason, setReason] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (open) { // Only run if modal is open
        if (supabaseDataService.getAllPatients().length === 0) {
          await supabaseDataService.loadPatientData();
        }
        setAllPatients(supabaseDataService.getAllPatients());
        // Removed the creation logic from here, it's handled by handleCreate
      }
    };
    loadInitialData();
  }, [open]); // Only dependent on 'open'

  const filteredPatients = allPatients.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.firstName?.toLowerCase().includes(term) ||
      p.lastName?.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  });

  const handleCreate = async () => {
    // reset errors
    const newErrors: Record<string, boolean> = {};
    if (tab === 'existing') {
      if (!selectedPatient) newErrors.selectedPatient = true;
    } else {
      if (!firstName.trim()) newErrors.firstName = true;
      if (!lastName.trim()) newErrors.lastName = true;
      if (!gender) newErrors.gender = true;
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // trigger shake animation
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    try {
      let createdPatient: Patient | null = null;
      let createdAdmission: Admission | null = null;

      if (tab === 'existing') {
        if (!selectedPatient) return;
        const ad = await supabaseDataService.createNewAdmission(selectedPatient.id, {
          reason: reason || undefined,
          scheduledStart: scheduledDate ? scheduledDate.toISOString() : undefined,
          duration: duration || undefined,
        });
        createdPatient = selectedPatient;
        createdAdmission = ad;
        router.push(`/patients/${selectedPatient.id}?ad=${ad.id}`);
      } else {
        const { patient, admission } = await supabaseDataService.createNewPatientWithAdmission(
          { firstName, lastName, gender, dateOfBirth: dob ? format(dob, 'yyyy-MM-dd') : undefined },
          { reason: reason || undefined, scheduledStart: scheduledDate ? scheduledDate.toISOString() : undefined, duration: duration || undefined }
        );
        createdPatient = patient;
        createdAdmission = admission;
        router.push(`/patients/${patient.id}?ad=${admission.id}`);
      }

      if (onConsultationCreated) {
        onConsultationCreated(createdPatient, createdAdmission);
      }
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to create consultation', e);
      alert('Could not start consultation. See console for details.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{/* hidden trigger; open controlled externally */}</DialogTrigger>
      <DialogContent className={`max-w-lg ${shake ? 'animate-shake' : ''}`}>
        <DialogHeader>
          <DialogTitle>Start New Consultation</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="existing">Existing Patient</TabsTrigger>
            <TabsTrigger value="new">New Patient</TabsTrigger>
          </TabsList>

          {/* Existing patient tab */}
          <TabsContent value="existing">
            <div className="space-y-4">
              <label className="font-semibold text-step--1 flex items-center">
                Select patient <span className="text-destructive">*</span>{errors.selectedPatient && <span className="text-destructive text-xs ml-2">Required field</span>}
              </label>
              {selectedPatient ? (
                <div className="border rounded-md px-3 py-2 flex justify-between items-center bg-muted/20">
                  <span className="text-step--1">{selectedPatient.name || `${selectedPatient.firstName ?? ''} ${selectedPatient.lastName ?? ''}`.trim() || selectedPatient.id}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="relative border-b p-1">
                    <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      placeholder="Search patient by name or ID..."
                      className="pl-10 text-step--1"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className="px-3 py-2 cursor-pointer hover:bg-muted/50 text-step--1 text-[var(--placeholder-color)] opacity-[var(--placeholder-opacity)]"
                      >
                        {p.name || `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.id}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Reason */}
              <div>
                <label className="font-semibold text-step--1">Reason for visit</label>
                <Input
                  placeholder="E.g., joint pain, generalized inflammation"
                  className="mt-1 text-step--1"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              {/* Date time */}
              <div>
                <label className="font-semibold text-step--1">Date and time</label>
                <StyledDatePicker
                  placeholderText={format(new Date(), 'Pp')}
                  selected={scheduledDate}
                  onChange={(d: Date | null) => setScheduledDate(d)}
                  showTimeSelect
                  timeInputLabel="Time:"
                  dateFormat="MM/dd/yyyy, h:mm aa"
                  className="mt-1"
                  timeIntervals={1}
                  popperClassName="z-[60]"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              {/* Duration selection */}
              <div>
                <label className="font-semibold text-step--1">Duration</label>
                <select
                  value={duration || ''}
                  onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : null)}
                  className={cn(
                    "w-full mt-1 px-3 py-2 border rounded-md bg-background text-step--1 font-sans",
                    !duration ? "text-[var(--placeholder-color)] opacity-[var(--placeholder-opacity)]" : "text-foreground opacity-100"
                  )}
                >
                  <option value="" disabled>Select duration</option>
                  {Array.from({ length: 24 }, (_, i) => (i + 1) * 5).map(minutes => (
                    <option key={minutes} value={minutes}>{minutes} min</option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>

          {/* New patient tab */}
          <TabsContent value="new">
            <div className="space-y-3">
              <p className="font-semibold text-step--1">Patient info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-step--1">First name <span className="text-destructive">*</span></label>
                  <Input
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 text-step--1"
                  />
                  {errors.firstName && <span className="text-destructive text-xs ml-1">Required field</span>}
                </div>
                <div>
                  <label className="font-semibold text-step--1">Last name <span className="text-destructive">*</span></label>
                  <Input
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 text-step--1"
                  />
                  {errors.lastName && <span className="text-destructive text-xs ml-1">Required field</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-step--1">Gender <span className="text-destructive">*</span></label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={cn(
                      "w-full mt-1 px-3 py-2 border rounded-md bg-background text-step--1 font-sans",
                      !gender ? "text-[var(--placeholder-color)] opacity-[var(--placeholder-opacity)]" : "text-foreground opacity-100"
                    )}
                  >
                    <option value="" disabled className="text-muted-foreground">
                      Select gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-step--1">Date of Birth</label>
                  <StyledDatePicker
                    placeholderText="dd/mm/yyyy"
                    selected={dob}
                    onChange={(d: Date | null) => setDob(d)}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                    popperClassName="z-[60]"
                  />
                </div>
              </div>
              {/* Reason */}
              <div>
                <label className="font-semibold text-step--1">Reason for visit</label>
                <Input
                  placeholder="E.g., joint pain, generalized inflammation"
                  className="mt-1 text-step--1"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              {/* Date time */}
              <div>
                <label className="font-semibold text-step--1">Date and time</label>
                <StyledDatePicker
                  placeholderText={format(new Date(), 'Pp')}
                  selected={scheduledDate}
                  onChange={(d: Date | null) => setScheduledDate(d)}
                  showTimeSelect
                  timeInputLabel="Time:"
                  dateFormat="MM/dd/yyyy, h:mm aa"
                  className="mt-1"
                  timeIntervals={1}
                  popperClassName="z-[60]"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              {/* Duration selection - New Patient tab */}
              <div>
                <label className="font-semibold text-step--1">Duration</label>
                <select
                  value={duration || ''}
                  onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : null)}
                  className={cn(
                    "w-full mt-1 px-3 py-2 border rounded-md bg-background text-step--1 font-sans",
                    !duration ? "text-[var(--placeholder-color)] opacity-[var(--placeholder-opacity)]" : "text-foreground opacity-100"
                  )}
                >
                  <option value="" disabled>Select duration</option>
                  {Array.from({ length: 24 }, (_, i) => (i + 1) * 5).map(minutes => (
                    <option key={minutes} value={minutes}>{minutes} min</option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* shared fields now handled inside tabs */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" iconLeft={<PlayCircle />} onClick={handleCreate}>
            Start Consultation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 