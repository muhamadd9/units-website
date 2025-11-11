import { useEffect, useState } from "react";
import { companyOneUnitsAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiFilter, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Dropdown } from "primereact/dropdown";
import Pagination from "@/components/ui/pagination";
import { FiEye } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmAlert from "@/components/ui/ConfirmAlert";
import { useForm, Controller } from "react-hook-form";

const CompanyOneUnitsAdmin = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({ building: "all", status: "all", bedrooms: "all" as string | number });
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const { register, handleSubmit, control, reset, formState: { errors }, setValue } = useForm();

  // Dynamic dropdown options
  const [buildingOptions, setBuildingOptions] = useState<{ label: string; value: string }[]>([{ label: "All Buildings", value: "all" }]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([{ label: "All Statuses", value: "all" }]);
  const [bedroomsOptions, setBedroomsOptions] = useState<{ label: string; value: number | string }[]>([{ label: "Any Bedrooms", value: "all" }]);

  const loadUnits = async () => {
    setLoading(true);
    try {
      let params: any = { page: currentPage, limit: itemsPerPage };
      if (filters.building !== "all") params.building = filters.building;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.bedrooms !== "all") params.bedrooms = filters.bedrooms;
      const res = await companyOneUnitsAPI.getAll(params);
      setUnits(res.data.data.units || []);
      setTotalItems(res.data.data.count || 0);
    } catch (error) {
      console.error("Error loading units:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [currentPage, filters]);

  // Load meta options once from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await companyOneUnitsAPI.getMeta();
        const meta = res.data.data || {};
        if (meta.buildings) setBuildingOptions([{ label: "All Buildings", value: "all" }, ...meta.buildings.map((b: string) => ({ label: `Building ${b}`, value: b }))]);
        if (meta.statuses) setStatusOptions([{ label: "All Statuses", value: "all" }, ...meta.statuses.map((s: string) => ({ label: s, value: s }))]);
        if (meta.bedrooms) setBedroomsOptions([{ label: "Any Bedrooms", value: "all" }, ...meta.bedrooms.map((n: number) => ({ label: String(n), value: n }))]);
      } catch { }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    ConfirmAlert({
      title: "Delete Unit",
      message: "Are you sure you want to delete this unit?",
      onConfirm: async () => {
        try {
          await companyOneUnitsAPI.delete(id);
          loadUnits();
        } catch (error) {
          console.error("Error deleting unit:", error);
        }
      },
    });
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setValue("unit", unit.unit);
    setValue("building", unit.building);
    setValue("area", unit.area);
    setValue("bedrooms", unit.bedrooms);
    setValue("price", unit.price);
    setValue("view", unit.view);
    setValue("orientation", unit.orientation);
    setValue("status", unit.status);
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingUnit) {
        await companyOneUnitsAPI.update(editingUnit._id, data);
      } else {
        await companyOneUnitsAPI.create(data);
      }
      reset();
      setEditingUnit(null);
      setShowForm(false);
      loadUnits();
    } catch (error) {
      console.error("Error saving unit:", error);
    }
  };

  const resetFilters = () => {
    setFilters({ building: "all", status: "all", bedrooms: "all" });
    setCurrentPage(1);
  };

  if (loading && units.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <section className="w-full px-12 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Zaya Development Units</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{totalItems} {totalItems === 1 ? "unit" : "units"} found</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${showFilters ? "bg-muted border border-border text-foreground" : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
          >
            {showFilters ? <FiX size={18} /> : <FiFilter size={18} />}
            <span className="text-sm font-medium">Filters</span>
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setEditingUnit(null); reset(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-sm hover:bg-foreground/90 cursor-pointer text-sm transition-colors"
          >
            <FiPlus size={18} />
            <span className="text-sm font-medium">{showForm ? "Cancel" : "Add Unit"}</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-card p-5 rounded-xl shadow-sm border border-border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Building</label>
              <Dropdown
                value={filters.building}
                onChange={(e) => setFilters({ ...filters, building: e.value })}
                options={buildingOptions}
                className="w-full border border-input bg-muted rounded-lg"
                optionLabel="label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Dropdown
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.value })}
                options={statusOptions}
                className="w-full border border-input bg-muted rounded-lg"
                optionLabel="label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bedrooms</label>
              <Dropdown
                value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.value })}
                options={bedroomsOptions}
                className="w-full border border-input bg-muted rounded-lg"
                optionLabel="label"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingUnit ? "Edit Unit" : "Add New Unit"}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Unit *</label>
              <input {...register("unit", { required: true })} className="w-full p-3 border border-input rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Building *</label>
              <Controller
                name="building"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    options={["A", "B", "C", "D", "E"].map((b) => ({ label: b, value: b }))}
                    className="w-full"
                    optionLabel="label"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Area *</label>
              <input type="number" {...register("area", { required: true, min: 0 })} className="w-full p-3 border border-input rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bedrooms *</label>
              <input type="number" {...register("bedrooms", { required: true, min: 0 })} className="w-full p-3 border border-input rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price *</label>
              <input type="number" {...register("price", { required: true, min: 0 })} className="w-full p-3 border border-input rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">View *</label>
              <input {...register("view", { required: true })} className="w-full p-3 border border-input rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Orientation *</label>
              <input {...register("orientation", { required: true })} className="w-full p-3 border border-input rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    options={[
                      { label: "Available", value: "available" },
                      { label: "Booked", value: "booked" },
                      { label: "Sold", value: "sold" },
                      { label: "MOKP", value: "mokp" },
                      { label: "Hold", value: "hold" },
                    ]}
                    className="w-full"
                    optionLabel="label"
                  />
                )}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); reset(); setEditingUnit(null); }} className="px-6 py-2 border border-input rounded-lg hover:bg-muted">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90">
                {editingUnit ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {units.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
          <h3 className="text-lg font-medium text-foreground">No units found</h3>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl shadow overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Building</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Bedrooms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {units.map((unit) => (
                    <tr key={unit._id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{unit.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{unit.building}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{unit.area}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{unit.bedrooms}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{unit.price?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${unit.status === "available" ? "bg-muted text-foreground border border-border" :
                            unit.status === "sold" ? "bg-foreground text-background" :
                              unit.status === "booked" ? "bg-accent text-accent-foreground" :
                                "bg-muted text-muted-foreground border border-border"
                            }`}>
                            {unit.status}
                          </span>
                          {unit.status !== 'available' && unit.clientBooking && (
                            <button
                              onClick={() => { setSelectedClient(unit.clientBooking); setDetailsOpen(true); }}
                              className="p-1.5 rounded-md border border-border hover:bg-muted"
                              aria-label="View client details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(unit)}
                          className="h-9 w-9 flex items-center justify-center rounded-md text-foreground hover:bg-muted"
                          aria-label="Edit unit"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(unit._id)}
                          className="h-9 w-9 flex items-center justify-center rounded-md text-destructive hover:bg-muted"
                          aria-label="Delete unit"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalItems > itemsPerPage && (
            <div className="mt-8">
              <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}

      {/* Client Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Client Name</p>
              <p className="text-sm font-medium">{selectedClient?.clientName || '-'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{selectedClient?.email || '-'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{selectedClient?.phone || '-'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="text-sm font-medium">{selectedClient?.paymentMethod || '-'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium capitalize">{selectedClient?.status || '-'}</p>
            </div>
            <div className="rounded-lg border p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">Created By</p>
              <p className="text-sm font-medium">{selectedClient?.createdBy?.fullName} ({selectedClient?.createdBy?.email})</p>
            </div>
            <div className="rounded-lg border p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="text-sm font-medium">{selectedClient?.createdAt ? new Date(selectedClient.createdAt).toLocaleString() : '-'}</p>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDetailsOpen(false)} className="px-4 py-2 border border-input rounded-lg">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CompanyOneUnitsAdmin;

// Client details modal UI (appended below component for clarity)
// Rendered by state within the component above

