import { useEffect, useState } from "react";
import { bookingsAPI } from "@/lib/api";
import { FiFilter, FiX, FiEye } from "react-icons/fi";
import { Dropdown } from "primereact/dropdown";
import PaginationClassic from "@/components/PaginationClassic";
import { useNavigate } from "react-router-dom";

const BookingsAdmin = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({ unitModel: "all", paymentMethod: "all", status: "all" });
    const [showFilters, setShowFilters] = useState(false);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    const loadBookings = async () => {
        setLoading(true);
        try {
            let params: any = { page: currentPage, limit: itemsPerPage };
            if (filters.unitModel !== "all") params.unitModel = filters.unitModel;
            if (filters.paymentMethod !== "all") params.paymentMethod = filters.paymentMethod;
            const res = await bookingsAPI.getAll(params);
            setBookings(res.data.data.bookings || []);
            setTotalItems(res.data.data.count || 0);
        } catch (error) {
            console.error("Error loading bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [currentPage, filters]);

    const resetFilters = () => {
        setFilters({ unitModel: "all", paymentMethod: "all", status: "all" });
        setCurrentPage(1);
    };

    const toggleSelectAllCurrent = () => {
        const currentIds = bookings.map(b => b._id);
        const allSelected = currentIds.every(id => selectedIds.has(id));
        const next = new Set(selectedIds);
        if (allSelected) {
            currentIds.forEach(id => next.delete(id));
        } else {
            currentIds.forEach(id => next.add(id));
        }
        setSelectedIds(next);
    };

    const toggleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    const exportSelected = async () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        const res = await bookingsAPI.exportSelected(ids);
        downloadBlob(res.data, `bookings_selected_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportAll = async () => {
        const res = await bookingsAPI.exportAll();
        downloadBlob(res.data, `bookings_all_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
            </div>
        );
    }

    const UNIT_MODEL_LABELS: Record<string, string> = {
        CompanyOneUnit: "Zaya Development",
        CompanyTwoUnit: "Rikaz Development",
    };

    return (
        <div className="py-6  w-full px-12 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Bookings Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        {totalItems} {totalItems === 1 ? "booking" : "bookings"} found
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${showFilters
                            ? "bg-muted border border-border text-foreground"
                            : "bg-card border border-border text-foreground hover:bg-muted"
                            }`}
                    >
                        {showFilters ? <FiX size={18} /> : <FiFilter size={18} />}
                        <span className="text-sm font-medium">Filters</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={exportSelected}
                            disabled={selectedIds.size === 0}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium border ${selectedIds.size === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                        >
                            Export Selected
                        </button>
                        <button
                            onClick={exportAll}
                            className="px-4 py-2.5 rounded-lg text-sm font-medium border bg-card border-border text-foreground hover:bg-muted"
                        >
                            Export All
                        </button>
                    </div>
                </div>
            </div>

            {showFilters && (
                <div className="bg-card p-5 rounded-xl shadow-sm border border-border mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Development</label>
                            <Dropdown
                                value={filters.unitModel}
                                onChange={(e) => setFilters({ ...filters, unitModel: e.value })}
                                options={[
                                    { label: "All", value: "all" },
                                    { label: "Zaya Development", value: "CompanyOneUnit" },
                                    { label: "Rikaz Development", value: "CompanyTwoUnit" },
                                ]}
                                className="w-full border border-input bg-muted rounded-lg"
                                optionLabel="label"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
                            <Dropdown
                                value={filters.paymentMethod}
                                onChange={(e) => setFilters({ ...filters, paymentMethod: e.value })}
                                options={[
                                    { label: "All Methods", value: "all" },
                                    { label: "cash", value: "cash" },
                                    { label: "installments", value: "installments" },
                                    { label: "transfer", value: "transfer" },
                                    { label: "other", value: "other" },
                                ]}
                                className="w-full border border-input bg-muted rounded-lg"
                                optionLabel="label"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                            <Dropdown
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.value })}
                                options={[
                                    { label: "All", value: "all" },
                                    { label: "available", value: "available" },
                                    { label: "booked", value: "booked" },
                                    { label: "sold", value: "sold" },
                                    { label: "mokp", value: "mokp" },
                                    { label: "hold", value: "hold" },
                                ]}
                                className="w-full border border-input bg-muted rounded-lg"
                                optionLabel="label"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                            Reset All Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-xl shadow overflow-hidden border border-border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all"
                                        checked={bookings.length > 0 && bookings.every(b => selectedIds.has(b._id))}
                                        onChange={toggleSelectAllCurrent}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Payment Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Development</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 text-center text-muted-foreground">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                aria-label="Select row"
                                                checked={selectedIds.has(booking._id)}
                                                onChange={() => toggleSelectOne(booking._id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground">{booking.clientName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{booking.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{booking.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 rounded-full text-xs bg-muted text-foreground border border-border">{booking.paymentMethod}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{UNIT_MODEL_LABELS[booking.unitModel] || booking.unitModel}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'available' ? 'bg-muted text-foreground border border-border' : booking.status === 'sold' ? 'bg-foreground text-background' : 'bg-accent text-accent-foreground'}`}>
                                                {booking.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{booking.createdBy?.fullName || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{new Date(booking.createdAt).toLocaleString()}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalItems > itemsPerPage && (
                <div className="mt-8">
                    <PaginationClassic
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};

export default BookingsAdmin;
