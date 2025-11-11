import { useEffect, useMemo, useState } from "react";
import { companyTwoUnitsAPI, bookingsAPI } from "@/lib/api";
import { Dropdown } from "primereact/dropdown";
import PaginationClassic from "@/components/PaginationClassic";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanyTwoUnit {
  _id: string;
  unit: string;
  building: string;
  floor: number;
  totalPrice: number;
  totalArea: number;
  balcony: number;
  netArea: number;
  modelCode: string;
  view: string;
  orientation: string;
  status?: string;
}

const CompanyTwoUnits = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState<CompanyTwoUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  const [building, setBuilding] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [orientation, setOrientation] = useState<string>("all");
  const [modelCode, setModelCode] = useState<string>("all");
  const [floor, setFloor] = useState<string>("all");

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<CompanyTwoUnit | null>(null);
  const [bookingForm, setBookingForm] = useState({
    clientName: "",
    email: "",
    phone: "",
    paymentMethod: "cash" as "cash" | "installments" | "transfer" | "other",
    status: "booked" as "available" | "booked" | "sold" | "mokp" | "hold",
  });

  const [buildingOptions, setBuildingOptions] = useState<{ label: string; value: string }[]>([{ label: "All Buildings", value: "all" }]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([{ label: "All Statuses", value: "all" }]);
  const [orientationOptions, setOrientationOptions] = useState<{ label: string; value: string }[]>([{ label: "All Orientations", value: "all" }]);
  const [modelCodeOptions, setModelCodeOptions] = useState<{ label: string; value: string }[]>([{ label: "All Models", value: "all" }]);
  const [floorOptions, setFloorOptions] = useState<{ label: string; value: string }[]>([{ label: "All Floors", value: "all" }]);

  const dropdownClass = "w-full border border-input bg-muted rounded-lg";

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, limit: itemsPerPage };
      if (building !== "all") params.building = building;
      if (orientation !== "all") params.orientation = orientation;
      if (modelCode !== "all") params.modelCode = modelCode;
      if (floor !== "all") params.floor = Number(floor);

      const res = await companyTwoUnitsAPI.getAll(params);
      const fetched: CompanyTwoUnit[] = res.data.data.units || [];
      setUnits(fetched);
      setTotalItems(res.data.data.count || 0);


    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, building, orientation, modelCode, floor]);

  useEffect(() => {
    (async () => {
      try {
        const res = await companyTwoUnitsAPI.getMeta();
        const meta = res.data.data || {};
        if (meta.buildings) setBuildingOptions([{ label: "All Buildings", value: "all" }, ...meta.buildings.map((b: string) => ({ label: `Building ${b}`, value: b }))]);
        if (meta.statuses) setStatusOptions([{ label: "All Statuses", value: "all" }, ...meta.statuses.map((s: string) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))]);
        if (meta.orientations) setOrientationOptions([{ label: "All Orientations", value: "all" }, ...meta.orientations.map((o: string) => ({ label: o, value: o }))]);
        if (meta.modelCodes) setModelCodeOptions([{ label: "All Models", value: "all" }, ...meta.modelCodes.map((m: string) => ({ label: m, value: m }))]);
        if (meta.floors) setFloorOptions([{ label: "All Floors", value: "all" }, ...meta.floors.map((f: number) => ({ label: String(f), value: String(f) }))]);
      } catch { }
    })();
  }, []);

  const resetFilters = () => {
    setBuilding("all");
    setStatus("all");
    setOrientation("all");
    setModelCode("all");
    setFloor("all");
    setCurrentPage(1);
  };

  const displayedUnits = useMemo(() => {
    if (status === "all") return units;
    return units.filter(u => (u.status || "").toLowerCase() === status);
  }, [units, status]);

  const openBooking = (unit: CompanyTwoUnit) => {
    setSelectedUnit(unit);
    setBookingForm({ clientName: "", email: "", phone: "", paymentMethod: "cash", status: "booked" });
    setBookingOpen(true);
  };

  const submitBooking = async () => {
    if (!selectedUnit) return;
    setBookingSubmitting(true);
    try {
      await bookingsAPI.create({
        clientName: bookingForm.clientName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        paymentMethod: bookingForm.paymentMethod,
        unitModel: 'CompanyTwoUnit',
        unit: selectedUnit._id,
        status: bookingForm.status,
      });
      setBookingOpen(false);
      await load();
    } finally {
      setBookingSubmitting(false);
    }
  };

  const badgeClass = (s?: string) =>
    s === 'available'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : s === 'sold'
        ? 'bg-foreground text-background'
        : 'bg-yellow-100 text-yellow-800 border border-yellow-200';

  return (
    <section className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rikaz Development Units</h1>
          <p className="text-muted-foreground text-sm mt-1">{displayedUnits.length} {displayedUnits.length === 1 ? "unit" : "units"} found</p>
        </div>
        <button onClick={resetFilters} className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm">Reset Filters</button>
      </div>

      <div className="bg-card border rounded-xl p-4 md:p-6 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Building</label>
          <Dropdown value={building} onChange={(e) => { setBuilding(e.value); setCurrentPage(1); }} options={buildingOptions} className={dropdownClass} optionLabel="label" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Dropdown value={status} onChange={(e) => { setStatus(e.value); setCurrentPage(1); }} options={statusOptions} className={dropdownClass} optionLabel="label" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Orientation</label>
          <Dropdown value={orientation} onChange={(e) => { setOrientation(e.value); setCurrentPage(1); }} options={orientationOptions} className={dropdownClass} optionLabel="label" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Model Code</label>
          <Dropdown value={modelCode} onChange={(e) => { setModelCode(e.value); setCurrentPage(1); }} options={modelCodeOptions} className={dropdownClass} optionLabel="label" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Floor</label>
          <Dropdown value={floor} onChange={(e) => { setFloor(e.value); setCurrentPage(1); }} options={floorOptions} className={dropdownClass} optionLabel="label" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-foreground"></div>
        </div>
      ) : displayedUnits.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <h3 className="text-lg font-medium">No units found</h3>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedUnits.map((u) => (
              <div key={u._id} className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-xl tracking-tight">{u.unit}</h3>
                      <p className="text-sm text-muted-foreground">Building {u.building} • Floor {u.floor}</p>
                    </div>
                    {u.status && (
                      <span className={`text-xs px-2 py-1 rounded-full border ${badgeClass(u.status)}`}>
                        {u.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Total Area</p>
                      <p className="font-medium">{u.totalArea} m²</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Total Price</p>
                      <p className="font-medium">{u.totalPrice?.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Orientation</p>
                      <p className="font-medium">{u.orientation}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Model</p>
                      <p className="font-medium">{u.modelCode}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Net Area</p>
                      <p className="font-medium">{u.netArea} m²</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Balcony</p>
                      <p className="font-medium">{u.balcony} m²</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3 col-span-2">
                      <p className="text-muted-foreground">View</p>
                      <p className="font-medium break-words">{u.view}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      disabled={u.status !== 'available' || !user}
                      onClick={() => openBooking(u)}
                      className={`px-4 py-2 rounded-md text-background ${u.status !== 'available' || !user ? 'bg-muted cursor-not-allowed' : 'bg-foreground hover:bg-foreground/90'}`}
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalItems > itemsPerPage && (
            <div className="mt-8">
              <PaginationClassic totalItems={totalItems} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Unit {selectedUnit?.unit}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <input
              className="w-full p-3 border border-input rounded-lg bg-background"
              placeholder="Full name"
              value={bookingForm.clientName}
              onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
            />
            <input
              className="w-full p-3 border border-input rounded-lg bg-background"
              placeholder="Email"
              type="email"
              value={bookingForm.email}
              onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
            />
            <input
              className="w-full p-3 border border-input rounded-lg bg-background"
              placeholder="Phone"
              value={bookingForm.phone}
              onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select
                  value={bookingForm.paymentMethod}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, paymentMethod: value as "cash" | "installments" | "transfer" | "other" })}
                >
                  <SelectTrigger className="w-full border border-input bg-muted rounded-lg">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="installments">Installments</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={bookingForm.status}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, status: value as "available" | "booked" | "sold" | "mokp" | "hold" })}
                >
                  <SelectTrigger className="w-full border border-input bg-muted rounded-lg">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="mokp">Mokp</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setBookingOpen(false)} className="px-4 py-2 border border-input rounded-lg">Cancel</button>
            <button onClick={submitBooking} disabled={bookingSubmitting} className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90">
              {bookingSubmitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CompanyTwoUnits;
