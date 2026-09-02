import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PrescriptionFields(props: {
  date: string;
  setDate: (v: string) => void;
  doctor: string;
  setDoctor: (v: string) => void;
  specialty: string;
  setSpecialty: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  disabled?: boolean;
}) {
  const { date, setDate, doctor, setDoctor, specialty, setSpecialty, notes, setNotes, disabled } =
    props;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          required
          disabled={disabled}
          className="h-12 w-full"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="doctor">Doctor</Label>
        <Input
          id="doctor"
          disabled={disabled}
          className="h-12 w-full"
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
        />
      </div>
      <div className="min-w-0 space-y-2 sm:col-span-2">
        <Label htmlFor="specialty">Specialty</Label>
        <Input
          id="specialty"
          disabled={disabled}
          className="h-12 w-full"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
      </div>
      <div className="min-w-0 space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          disabled={disabled}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
