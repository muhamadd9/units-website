import { useEffect, useState } from "react";
import { companyOneUnitsAPI, bookingsAPI } from "@/lib/api";
import { Dropdown } from "primereact/dropdown";
import PaginationClassic from "@/components/PaginationClassic";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CompanyOneUnit {
    _id: string;
    company: "Sakaya" | "Upvida";
    view: string;
    orientation: string;
    status: string;
    // Sakaya fields
    unit?: string;
    building?: string;
    area?: number;
    bedrooms?: number;
    price?: number;
    // Upvida fields
    totalPrice?: number;
    totalArea?: number;
    balcony?: number;
    netArea?: number;
    modelName?: string;
    floorNumber?: string;
    unitNumber?: string;
    buildingNumber?: string;
    towerNumber?: string;
}

const CompanyOneUnits = () => {
    const { user } = useAuth();
    const [units, setUnits] = useState<CompanyOneUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;

    const [company, setCompany] = useState<string>("all");
    const [building, setBuilding] = useState<string>("all");
    const [status, setStatus] = useState<string>("all");
    const [bedrooms, setBedrooms] = useState<string | number>("all");

    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<CompanyOneUnit | null>(null);
    const [bookingForm, setBookingForm] = useState({
        clientName: "",
        email: "",
        phone: "",
        paymentMethod: "cash" as "cash" | "installments" | "transfer" | "other",
        status: "booked" as "available" | "booked" | "sold" | "mokp" | "hold",
    });

    const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([{ label: "All Companies", value: "all" }]);
    const [buildingOptions, setBuildingOptions] = useState<{ label: string; value: string }[]>([{ label: "All Buildings", value: "all" }]);
    const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([{ label: "All Statuses", value: "all" }]);
    const [bedroomsOptions, setBedroomsOptions] = useState<{ label: string; value: number | string }[]>([{ label: "Any Bedrooms", value: "all" }]);

    const load = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page: currentPage, limit: itemsPerPage };
            if (company !== "all") params.company = company;
            if (building !== "all") params.building = building;
            if (status !== "all") params.status = status;
            if (bedrooms !== "all") params.bedrooms = bedrooms;

            const res = await companyOneUnitsAPI.getAll(params);
            setUnits(res.data.data.units || []);
            setTotalItems(res.data.data.count || 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, company, building, status, bedrooms]);

    // fetch meta for dropdowns once
    useEffect(() => {
        (async () => {
            try {
                const res = await companyOneUnitsAPI.getMeta();
                const meta = res.data.data || {};
                if (meta.companies) setCompanyOptions([{ label: "All Companies", value: "all" }, ...meta.companies.map((c: string) => ({ label: c, value: c }))]);
                if (meta.buildings) setBuildingOptions([{ label: "All Buildings", value: "all" }, ...meta.buildings.map((b: string) => ({ label: `Building ${b}`, value: b }))]);
                if (meta.statuses) setStatusOptions([{ label: "All Statuses", value: "all" }, ...meta.statuses.map((s: string) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))]);
                if (meta.bedrooms) setBedroomsOptions([{ label: "Any Bedrooms", value: "all" }, ...meta.bedrooms.map((n: number) => ({ label: String(n), value: n }))]);
            } catch { }
        })();
    }, []);

    const resetFilters = () => {
        setCompany("all");
        setBuilding("all");
        setStatus("all");
        setBedrooms("all");
        setCurrentPage(1);
    };

    const openBooking = (unit: CompanyOneUnit) => {
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
                unitModel: 'CompanyOneUnit',
                unit: selectedUnit._id,
                status: bookingForm.status,
            });
            setBookingOpen(false);
            await load();
        } finally {
            setBookingSubmitting(false);
        }
    };

    const badgeClass = (s: string) =>
        s === 'available'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : s === 'sold'
                ? 'bg-foreground text-background'
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200';

    const companyBadgeClass = (company: string) =>
        company === 'Sakaya'
            ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'bg-purple-100 text-purple-800 border border-purple-200';

    return (
        <section className="container mx-auto px-4 py-8 min-h-screen">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Zaya Development Units</h1>
                    <p className="text-muted-foreground text-sm mt-1">{totalItems} {totalItems === 1 ? "unit" : "units"} found</p>
                </div>
                <button onClick={resetFilters} className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm">Reset Filters</button>
            </div>

            <div className="bg-card border rounded-xl p-4 md:p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <Dropdown value={company} onChange={(e) => { setCompany(e.value); setCurrentPage(1); }} options={companyOptions} className="w-full border border-input bg-muted rounded-lg" optionLabel="label" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Building</label>
                    <Dropdown value={building} onChange={(e) => { setBuilding(e.value); setCurrentPage(1); }} options={buildingOptions} className="w-full border border-input bg-muted rounded-lg" optionLabel="label" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Dropdown value={status} onChange={(e) => { setStatus(e.value); setCurrentPage(1); }} options={statusOptions} className="w-full border border-input bg-muted rounded-lg" optionLabel="label" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Bedrooms</label>
                    <Dropdown value={bedrooms} onChange={(e) => { setBedrooms(e.value); setCurrentPage(1); }} options={bedroomsOptions} className="w-full border border-input bg-muted rounded-lg" optionLabel="label" />
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
                                            {u.company === "Sakaya" ? (
                                                <>
                                                    <h3 className="font-semibold text-xl tracking-tight">{u.unit}</h3>
                                                    <p className="text-sm text-muted-foreground">Building {u.building}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <h3 className="font-semibold text-xl tracking-tight">Unit {u.unitNumber}</h3>
                                                    <p className="text-sm text-muted-foreground">Tower {u.towerNumber}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 items-start justify-end">
                                            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${companyBadgeClass(u.company)}`}>
                                                {u.company}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full border ${badgeClass(u.status)}`}>
                                                {u.status}
                                            </span>
                                        </div>
                                    </div>

                                    {u.company === "Sakaya" ? (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Area</p>
                                                <p className="font-medium">{u.area} m²</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Bedrooms</p>
                                                <p className="font-medium">{u.bedrooms}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Price</p>
                                                <p className="font-medium">{u.price?.toLocaleString()}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Orientation</p>
                                                <p className="font-medium">{u.orientation}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3 col-span-2">
                                                <p className="text-muted-foreground">View</p>
                                                <p className="font-medium break-words">{u.view}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Model</p>
                                                <p className="font-medium">{u.modelName}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Floor</p>
                                                <p className="font-medium">{u.floorNumber}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Total Area</p>
                                                <p className="font-medium">{u.totalArea} m²</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Net Area</p>
                                                <p className="font-medium">{u.netArea} m²</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Balcony</p>
                                                <p className="font-medium">{u.balcony} m²</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Building</p>
                                                <p className="font-medium">{u.buildingNumber}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Price</p>
                                                <p className="font-medium">{u.totalPrice?.toLocaleString()}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-muted-foreground">Orientation</p>
                                                <p className="font-medium">{u.orientation}</p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3 col-span-2">
                                                <p className="text-muted-foreground">View</p>
                                                <p className="font-medium break-words">{u.view}</p>
                                            </div>
                                        </div>
                                    )}
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
                        <DialogTitle>
                            Book {selectedUnit?.company === "Sakaya" ? `Unit ${selectedUnit?.unit}` : `Unit ${selectedUnit?.unitNumber}`}
                        </DialogTitle>
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

export default CompanyOneUnits;
