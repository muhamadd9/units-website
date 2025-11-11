import { useEffect, useState } from "react";
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
  company: "Abyat Views" | "Dhahran Hills" | "The Node";
  blockNumber: string;
  landNumber: string;
  area: number;
  pricePerSquareMeter: number;
  usage: string;
  // Abyat Views specific
  totalValue?: number;
  // Dhahran Hills & The Node specific  
  landValue?: number;
  // The Node specific
  blockArea?: number;
  status?: string;
}

const CompanyTwoUnits = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState<CompanyTwoUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  const [company, setCompany] = useState<string>("all");
  const [blockNumber, setBlockNumber] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [usage, setUsage] = useState<string>("all");

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

  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([{ label: "All Companies", value: "all" }]);
  const [blockNumberOptions, setBlockNumberOptions] = useState<{ label: string; value: string }[]>([{ label: "All Blocks", value: "all" }]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([{ label: "All Statuses", value: "all" }]);
  const [usageOptions, setUsageOptions] = useState<{ label: string; value: string }[]>([{ label: "All Usages", value: "all" }]);

  const dropdownClass = "w-full border border-input bg-muted rounded-lg";

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, limit: itemsPerPage };
      if (company !== "all") params.company = company;
      if (blockNumber !== "all") params.blockNumber = blockNumber;
      if (usage !== "all") params.usage = usage;
      if (status !== "all") params.status = status;

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
  }, [currentPage, company, blockNumber, usage, status]);

  useEffect(() => {
    (async () => {
      try {
        const res = await companyTwoUnitsAPI.getMeta();
        const meta = res.data.data || {};
        if (meta.companies) setCompanyOptions([{ label: "All Companies", value: "all" }, ...meta.companies.map((c: string) => ({ label: c, value: c }))]);
        if (meta.blockNumbers) setBlockNumberOptions([{ label: "All Blocks", value: "all" }, ...meta.blockNumbers.map((b: string) => ({ label: `Block ${b}`, value: b }))]);
        if (meta.statuses) setStatusOptions([{ label: "All Statuses", value: "all" }, ...meta.statuses.map((s: string) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))]);
        if (meta.usages) setUsageOptions([{ label: "All Usages", value: "all" }, ...meta.usages.map((u: string) => ({ label: u, value: u }))]);
      } catch { }
    })();
  }, []);

  const resetFilters = () => {
    setCompany("all");
    setBlockNumber("all");
    setStatus("all");
    setUsage("all");
    setCurrentPage(1);
  };

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

  const companyBadgeClass = (company: string) =>
    company === 'Abyat Views'
      ? 'bg-orange-100 text-orange-800 border border-orange-200'
      : company === 'Dhahran Hills'
        ? 'bg-purple-100 text-purple-800 border border-purple-200'
        : 'bg-indigo-100 text-indigo-800 border border-indigo-200';

  return (
    <section className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rikaz Development Units</h1>
          <p className="text-muted-foreground text-sm mt-1">{units.length} {units.length === 1 ? "unit" : "units"} found</p>
        </div>
        <button onClick={resetFilters} className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm">Reset Filters</button>
      </div>

      <div className="bg-card border rounded-xl p-4 md:p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Dropdown value={company} onChange={(e) => { setCompany(e.value); setCurrentPage(1); }} options={companyOptions} className={dropdownClass} optionLabel="label" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Block Number</label>
          <Dropdown value={blockNumber} onChange={(e) => { setBlockNumber(e.value); setCurrentPage(1); }} options={blockNumberOptions} className={dropdownClass} optionLabel="label" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Usage</label>
          <Dropdown value={usage} onChange={(e) => { setUsage(e.value); setCurrentPage(1); }} options={usageOptions} className={dropdownClass} optionLabel="label" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Dropdown value={status} onChange={(e) => { setStatus(e.value); setCurrentPage(1); }} options={statusOptions} className={dropdownClass} optionLabel="label" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-foreground"></div>
        </div>
      ) : units.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <h3 className="text-lg font-medium">No units found</h3>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {units.map((u) => (
              <div key={u._id} className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-5 space-y-4 flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-xl tracking-tight">Block {u.blockNumber}</h3>
                      <p className="text-sm text-muted-foreground">Land {u.landNumber}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {u.status && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${badgeClass(u.status)}`}>
                          {u.status}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full border ${companyBadgeClass(u.company)}`}>
                        {u.company}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Area</p>
                      <p className="font-medium">{u.area} m²</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-muted-foreground">Price/m²</p>
                      <p className="font-medium">{u.pricePerSquareMeter?.toLocaleString()}</p>
                    </div>
                    
                    {u.company === "Abyat Views" && u.totalValue !== undefined && (
                      <>
                        <div className="rounded-lg border bg-background p-3 col-span-2">
                          <p className="text-muted-foreground">Total Value</p>
                          <p className="font-medium">{u.totalValue?.toLocaleString()}</p>
                        </div>
                      </>
                    )}
                    
                    {u.company === "Dhahran Hills" && u.landValue !== undefined && (
                      <>
                        <div className="rounded-lg border bg-background p-3 col-span-2">
                          <p className="text-muted-foreground">Land Value</p>
                          <p className="font-medium">{u.landValue?.toLocaleString()}</p>
                        </div>
                      </>
                    )}
                    
                    {u.company === "The Node" && (
                      <>
                        {u.blockArea !== undefined && (
                          <div className="rounded-lg border bg-background p-3">
                            <p className="text-muted-foreground">Block Area</p>
                            <p className="font-medium">{u.blockArea} m²</p>
                          </div>
                        )}
                        {u.landValue !== undefined && (
                          <div className="rounded-lg border bg-background p-3">
                            <p className="text-muted-foreground">Land Value</p>
                            <p className="font-medium">{u.landValue?.toLocaleString()}</p>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="rounded-lg border bg-background p-3 col-span-2">
                      <p className="text-muted-foreground">Usage</p>
                      <p className="font-medium break-words">{u.usage}</p>
                    </div>
                  </div>
                </div>

                {/* Button at the bottom */}
                <div className="p-5 pt-0 mt-auto">
                  <button
                    disabled={u.status !== 'available' || !user}
                    onClick={() => openBooking(u)}
                    className={`w-full px-4 py-2.5 rounded-md font-medium text-background transition-colors ${u.status !== 'available' || !user ? 'bg-muted cursor-not-allowed' : 'bg-foreground hover:bg-foreground/90'}`}
                  >
                    Book Now
                  </button>
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
            <DialogTitle>Book Unit - Block {selectedUnit?.blockNumber}, Land {selectedUnit?.landNumber}</DialogTitle>
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
