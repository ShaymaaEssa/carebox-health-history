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
}) {
  const { date, setDate, doctor, setDoctor, specialty, setSpecialty, notes, setNotes } = props;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          required
          className="h-12"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="doctor">Doctor</Label>
        <Input id="doctor" className="h-12" value={doctor} onChange={(e) => setDoctor(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialty">Specialty</Label>
        <Input
          id="specialty"
          className="h-12"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </div>
  );
}
