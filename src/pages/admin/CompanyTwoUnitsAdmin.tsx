import { useEffect, useState } from "react";
import { companyTwoUnitsAPI } from "@/lib/api";
import { FiPlus, FiFilter, FiX, FiEdit2, FiTrash2, FiEye } from "react-icons/fi";
import { Dropdown } from "primereact/dropdown";
import Pagination from "@/components/ui/pagination";
import ConfirmAlert from "@/components/ui/ConfirmAlert";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const CompanyTwoUnitsAdmin = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({ company: "all", status: "all", blockNumber: "all" });
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const itemsPerPage = 10;

  // Dynamic dropdown options from backend meta
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([{ label: "All Companies", value: "all" }]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([{ label: "All Statuses", value: "all" }]);
  const [blockNumberOptions, setBlockNumberOptions] = useState<{ label: string; value: string }[]>([{ label: "All Blocks", value: "all" }]);

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isValid } } = useForm({ mode: "onChange" });
  const watchCompany = watch("company", "Abyat Views");

  const loadUnits = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, limit: itemsPerPage };
      if (filters.company !== "all") params.company = filters.company;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.blockNumber !== "all") params.blockNumber = filters.blockNumber;

      const res = await companyTwoUnitsAPI.getAll(params);
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

  // Load meta options once
  useEffect(() => {
    (async () => {
      try {
        const res = await companyTwoUnitsAPI.getMeta();
        const meta = res.data.data || {};
        if (meta.companies) setCompanyOptions([{ label: "All Companies", value: "all" }, ...meta.companies.map((c: string) => ({ label: c, value: c }))]);
        if (meta.statuses) setStatusOptions([{ label: "All Statuses", value: "all" }, ...meta.statuses.map((s: string) => ({ label: s, value: s }))]);
        if (meta.blockNumbers) setBlockNumberOptions([{ label: "All Blocks", value: "all" }, ...meta.blockNumbers.map((b: string) => ({ label: `Block ${b}`, value: b }))]);
      } catch { }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    ConfirmAlert({
      title: "Delete Unit",
      message: "Are you sure you want to delete this unit?",
      onConfirm: async () => {
        try {
          await companyTwoUnitsAPI.delete(id);
          loadUnits();
        } catch (error) {
          console.error("Error deleting unit:", error);
        }
      },
    });
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setValue("company", unit.company);
    setValue("blockNumber", unit.blockNumber);
    setValue("landNumber", unit.landNumber);
    setValue("area", unit.area);
    setValue("pricePerSquareMeter", unit.pricePerSquareMeter);
    setValue("usage", unit.usage);
    setValue("status", unit.status);

    if (unit.company === "Abyat Views") {
      setValue("totalValue", unit.totalValue);
    } else if (unit.company === "Dhahran Hills") {
      setValue("landValue", unit.landValue);
    } else if (unit.company === "The Node") {
      setValue("blockArea", unit.blockArea);
      setValue("landValue", unit.landValue);
    }
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    try {
      // Clean payload based on company type
      const cleanedData: any = {
        company: data.company,
        blockNumber: data.blockNumber,
        landNumber: data.landNumber,
        area: Number(data.area),
        pricePerSquareMeter: Number(data.pricePerSquareMeter),
        usage: data.usage,
        status: data.status || "available",
      };

      if (data.company === "Abyat Views") {
        cleanedData.totalValue = Number(data.totalValue);
      } else if (data.company === "Dhahran Hills") {
        cleanedData.landValue = Number(data.landValue);
      } else if (data.company === "The Node") {
        cleanedData.blockArea = Number(data.blockArea);
        cleanedData.landValue = Number(data.landValue);
      }

      if (editingUnit) {
        await companyTwoUnitsAPI.update(editingUnit._id, cleanedData);
      } else {
        await companyTwoUnitsAPI.create(cleanedData);
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
    setFilters({ company: "all", status: "all", blockNumber: "all" });
    setCurrentPage(1);
  };

  const dropdownStyle = "w-full border border-input bg-muted rounded-lg";


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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Rikaz Development Units</h1>
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
              <label className="block text-sm font-medium text-foreground mb-2">Company</label>
              <Dropdown
                value={filters.company}
                onChange={(e) => { setFilters({ ...filters, company: e.value }); setCurrentPage(1); }}
                options={companyOptions}
                className={dropdownStyle}
                optionLabel="label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Dropdown
                value={filters.status}
                onChange={(e) => { setFilters({ ...filters, status: e.value }); setCurrentPage(1); }}
                options={statusOptions}
                className={dropdownStyle}
                optionLabel="label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Block Number</label>
              <Dropdown
                value={filters.blockNumber}
                onChange={(e) => { setFilters({ ...filters, blockNumber: e.value }); setCurrentPage(1); }}
                options={blockNumberOptions}
                className={dropdownStyle}
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
            {/* Company Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Company *</label>
              <Controller
                name="company"
                control={control}
                rules={{ required: "Company is required" }}
                defaultValue="Abyat Views"
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    options={[
                      { label: "Abyat Views", value: "Abyat Views" },
                      { label: "Dhahran Hills", value: "Dhahran Hills" },
                      { label: "The Node", value: "The Node" },
                    ]}
                    className="w-full"
                    optionLabel="label"
                  />
                )}
              />
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message as string}</p>}
            </div>

            {/* Common Fields for all companies */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Block Number *</label>
              <input
                {...register("blockNumber", {
                  required: "Block Number is required",
                  minLength: { value: 1, message: "Block Number must be at least 1 character" }
                })}
                className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.blockNumber ? 'border-red-500' : 'border-input'}`}
              />
              {errors.blockNumber && <p className="text-red-500 text-xs mt-1">{errors.blockNumber.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Land Number *</label>
              <input
                {...register("landNumber", {
                  required: "Land Number is required",
                  minLength: { value: 1, message: "Land Number must be at least 1 character" }
                })}
                className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.landNumber ? 'border-red-500' : 'border-input'}`}
              />
              {errors.landNumber && <p className="text-red-500 text-xs mt-1">{errors.landNumber.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Area *</label>
              <input
                type="number"
                step="0.01"
                {...register("area", {
                  required: "Area is required",
                  min: { value: 0, message: "Area must be at least 0" }
                })}
                className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.area ? 'border-red-500' : 'border-input'}`}
              />
              {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price per Square Meter *</label>
              <input
                type="number"
                step="0.01"
                {...register("pricePerSquareMeter", {
                  required: "Price per Square Meter is required",
                  min: { value: 0, message: "Price must be at least 0" }
                })}
                className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.pricePerSquareMeter ? 'border-red-500' : 'border-input'}`}
              />
              {errors.pricePerSquareMeter && <p className="text-red-500 text-xs mt-1">{errors.pricePerSquareMeter.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Usage *</label>
              <input
                {...register("usage", {
                  required: "Usage is required",
                  minLength: { value: 1, message: "Usage must be at least 1 character" }
                })}
                className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.usage ? 'border-red-500' : 'border-input'}`}
              />
              {errors.usage && <p className="text-red-500 text-xs mt-1">{errors.usage.message as string}</p>}
            </div>

            {/* Abyat Views specific */}
            {watchCompany === "Abyat Views" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Total Value *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("totalValue", {
                    required: watchCompany === "Abyat Views" ? "Total Value is required" : false,
                    min: { value: 0, message: "Total Value must be at least 0" }
                  })}
                  className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.totalValue ? 'border-red-500' : 'border-input'}`}
                />
                {errors.totalValue && <p className="text-red-500 text-xs mt-1">{errors.totalValue.message as string}</p>}
              </div>
            )}

            {/* Dhahran Hills specific */}
            {watchCompany === "Dhahran Hills" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Land Value *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("landValue", {
                    required: watchCompany === "Dhahran Hills" ? "Land Value is required" : false,
                    min: { value: 0, message: "Land Value must be at least 0" }
                  })}
                  className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.landValue ? 'border-red-500' : 'border-input'}`}
                />
                {errors.landValue && <p className="text-red-500 text-xs mt-1">{errors.landValue.message as string}</p>}
              </div>
            )}

            {/* The Node specific */}
            {watchCompany === "The Node" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Block Area *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("blockArea", {
                      required: watchCompany === "The Node" ? "Block Area is required" : false,
                      min: { value: 0, message: "Block Area must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.blockArea ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.blockArea && <p className="text-red-500 text-xs mt-1">{errors.blockArea.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Land Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("landValue", {
                      required: watchCompany === "The Node" ? "Land Value is required" : false,
                      min: { value: 0, message: "Land Value must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.landValue ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.landValue && <p className="text-red-500 text-xs mt-1">{errors.landValue.message as string}</p>}
                </div>
              </>
            )}

            {/* Status - Common */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Controller
                name="status"
                control={control}
                defaultValue="available"
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
                    className="w-full border border-input bg-muted rounded-lg"
                    optionLabel="label"
                  />
                )}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); reset(); setEditingUnit(null); }} className="px-6 py-2 border border-input rounded-lg hover:bg-muted">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || Object.keys(errors).length > 0}
                className={`px-6 py-2 rounded-lg transition-colors ${isValid && Object.keys(errors).length === 0 ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'}`}
              >
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Block/Land</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {units.map((unit) => (
                    <tr key={unit._id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{unit.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <div>
                          <div className="font-medium">Block {unit.blockNumber}</div>
                          <div className="text-xs text-muted-foreground">Land {unit.landNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        <div className="space-y-1">
                          <div>{unit.area}m² • {unit.usage}</div>
                          <div className="text-xs text-muted-foreground">{unit.pricePerSquareMeter?.toLocaleString()}/m²</div>
                          {unit.company === "The Node" && unit.blockArea && (
                            <div className="text-xs text-muted-foreground">Block Area: {unit.blockArea}m²</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {unit.company === "Abyat Views" && unit.totalValue?.toLocaleString()}
                        {(unit.company === "Dhahran Hills" || unit.company === "The Node") && unit.landValue?.toLocaleString()}
                      </td>
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
                            <button onClick={() => { setSelectedClient(unit.clientBooking); setDetailsOpen(true); }} className="p-1.5 rounded-md border border-border hover:bg-muted" aria-label="View client details">
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

export default CompanyTwoUnitsAdmin;
