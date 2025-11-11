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
  const [filters, setFilters] = useState({ company: "all", building: "all", status: "all", bedrooms: "all" as string | number });
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<"Sakaya" | "Upvida">("Sakaya");
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const { register, handleSubmit, control, reset, formState: { errors, isValid, isDirty }, setValue, watch } = useForm({ mode: "onChange" });
  const watchCompany = watch("company", "Sakaya");

  // Dynamic dropdown options
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([{ label: "All Companies", value: "all" }]);
  const [buildingOptions, setBuildingOptions] = useState<{ label: string; value: string }[]>([{ label: "All Buildings", value: "all" }]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([{ label: "All Statuses", value: "all" }]);
  const [bedroomsOptions, setBedroomsOptions] = useState<{ label: string; value: number | string }[]>([{ label: "Any Bedrooms", value: "all" }]);

  const loadUnits = async () => {
    setLoading(true);
    try {
      let params: any = { page: currentPage, limit: itemsPerPage };
      if (filters.company !== "all") params.company = filters.company;
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
        if (meta.companies) setCompanyOptions([{ label: "All Companies", value: "all" }, ...meta.companies.map((c: string) => ({ label: c, value: c }))]);
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
    setValue("company", unit.company);
    setValue("view", unit.view);
    setValue("orientation", unit.orientation);
    setValue("status", unit.status);

    if (unit.company === "Sakaya") {
      setValue("unit", unit.unit);
      setValue("building", unit.building);
      setValue("area", unit.area);
      setValue("bedrooms", unit.bedrooms);
      setValue("price", unit.price);
    } else if (unit.company === "Upvida") {
      setValue("totalPrice", unit.totalPrice);
      setValue("totalArea", unit.totalArea);
      setValue("balcony", unit.balcony);
      setValue("netArea", unit.netArea);
      setValue("modelName", unit.modelName);
      setValue("floorNumber", unit.floorNumber);
      setValue("unitNumber", unit.unitNumber);
      setValue("buildingNumber", unit.buildingNumber);
      setValue("towerNumber", unit.towerNumber);
    }
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    try {
      // Clean payload based on company type
      const cleanedData: any = {
        company: data.company,
        view: data.view,
        orientation: data.orientation,
        status: data.status || "available",
      };

      if (data.company === "Sakaya") {
        cleanedData.unit = data.unit;
        cleanedData.building = data.building;
        cleanedData.area = Number(data.area);
        cleanedData.bedrooms = Number(data.bedrooms);
        cleanedData.price = Number(data.price);
      } else if (data.company === "Upvida") {
        cleanedData.totalPrice = Number(data.totalPrice);
        cleanedData.totalArea = Number(data.totalArea);
        cleanedData.balcony = Number(data.balcony);
        cleanedData.netArea = Number(data.netArea);
        cleanedData.modelName = data.modelName;
        cleanedData.floorNumber = data.floorNumber;
        cleanedData.unitNumber = data.unitNumber;
        cleanedData.buildingNumber = data.buildingNumber;
        cleanedData.towerNumber = data.towerNumber;
      }

      if (editingUnit) {
        await companyOneUnitsAPI.update(editingUnit._id, cleanedData);
      } else {
        await companyOneUnitsAPI.create(cleanedData);
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
    setFilters({ company: "all", building: "all", status: "all", bedrooms: "all" });
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company</label>
              <Dropdown
                value={filters.company}
                onChange={(e) => { setFilters({ ...filters, company: e.value }); setCurrentPage(1); }}
                options={companyOptions}
                className="w-full border border-input bg-muted rounded-lg"
                optionLabel="label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Building</label>
              <Dropdown
                value={filters.building}
                onChange={(e) => { setFilters({ ...filters, building: e.value }); setCurrentPage(1); }}
                options={buildingOptions}
                className="w-full border border-input bg-muted rounded-lg"
                optionLabel="label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Dropdown
                value={filters.status}
                onChange={(e) => { setFilters({ ...filters, status: e.value }); setCurrentPage(1); }}
                options={statusOptions}
                className="w-full border border-input bg-muted rounded-lg"
                optionLabel="label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bedrooms</label>
              <Dropdown
                value={filters.bedrooms}
                onChange={(e) => { setFilters({ ...filters, bedrooms: e.value }); setCurrentPage(1); }}
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
            {/* Company Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Company *</label>
              <Controller
                name="company"
                control={control}
                rules={{ required: "Company is required" }}
                defaultValue="Sakaya"
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    options={[
                      { label: "Sakaya", value: "Sakaya" },
                      { label: "Upvida", value: "Upvida" },
                    ]}
                    className="w-full"
                    optionLabel="label"
                  />
                )}
              />
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message as string}</p>}
            </div>

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">View *</label>
              <input
                {...register("view", {
                  required: "View is required",
                  minLength: { value: 1, message: "View must be at least 1 character" },
                  maxLength: { value: 500, message: "View must be less than 500 characters" }
                })}
                className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.view ? 'border-red-500' : 'border-input'}`}
              />
              {errors.view && <p className="text-red-500 text-xs mt-1">{errors.view.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Orientation *</label>
              <input
                {...register("orientation", {
                  required: "Orientation is required",
                  minLength: { value: 1, message: "Orientation must be at least 1 character" },
                  maxLength: { value: 100, message: "Orientation must be less than 100 characters" }
                })}
                className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.orientation ? 'border-red-500' : 'border-input'}`}
              />
              {errors.orientation && <p className="text-red-500 text-xs mt-1">{errors.orientation.message as string}</p>}
            </div>

            {/* Sakaya-specific fields */}
            {watchCompany === "Sakaya" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Unit *</label>
                  <input
                    {...register("unit", {
                      required: watchCompany === "Sakaya" ? "Unit is required" : false,
                      minLength: { value: 1, message: "Unit must be at least 1 character" },
                      maxLength: { value: 20, message: "Unit must be less than 20 characters" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.unit ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Building *</label>
                  <input
                    {...register("building", {
                      required: watchCompany === "Sakaya" ? "Building is required" : false,
                      minLength: { value: 1, message: "Building must be at least 1 character" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.building ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.building && <p className="text-red-500 text-xs mt-1">{errors.building.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Area *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("area", {
                      required: watchCompany === "Sakaya" ? "Area is required" : false,
                      min: { value: 0, message: "Area must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.area ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Bedrooms *</label>
                  <input
                    type="number"
                    {...register("bedrooms", {
                      required: watchCompany === "Sakaya" ? "Bedrooms is required" : false,
                      min: { value: 0, message: "Bedrooms must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.bedrooms ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", {
                      required: watchCompany === "Sakaya" ? "Price is required" : false,
                      min: { value: 0, message: "Price must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.price ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message as string}</p>}
                </div>
              </>
            )}

            {/* Upvida-specific fields */}
            {watchCompany === "Upvida" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Total Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("totalPrice", {
                      required: watchCompany === "Upvida" ? "Total Price is required" : false,
                      min: { value: 0, message: "Total Price must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.totalPrice ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.totalPrice && <p className="text-red-500 text-xs mt-1">{errors.totalPrice.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Total Area *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("totalArea", {
                      required: watchCompany === "Upvida" ? "Total Area is required" : false,
                      min: { value: 0, message: "Total Area must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.totalArea ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.totalArea && <p className="text-red-500 text-xs mt-1">{errors.totalArea.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Balcony *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("balcony", {
                      required: watchCompany === "Upvida" ? "Balcony is required" : false,
                      min: { value: 0, message: "Balcony must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.balcony ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.balcony && <p className="text-red-500 text-xs mt-1">{errors.balcony.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Net Area *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("netArea", {
                      required: watchCompany === "Upvida" ? "Net Area is required" : false,
                      min: { value: 0, message: "Net Area must be at least 0" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.netArea ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.netArea && <p className="text-red-500 text-xs mt-1">{errors.netArea.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Model Name *</label>
                  <input
                    {...register("modelName", {
                      required: watchCompany === "Upvida" ? "Model Name is required" : false,
                      minLength: { value: 1, message: "Model Name must be at least 1 character" },
                      maxLength: { value: 100, message: "Model Name must be less than 100 characters" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.modelName ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.modelName && <p className="text-red-500 text-xs mt-1">{errors.modelName.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Floor Number *</label>
                  <input
                    {...register("floorNumber", {
                      required: watchCompany === "Upvida" ? "Floor Number is required" : false,
                      minLength: { value: 1, message: "Floor Number must be at least 1 character" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.floorNumber ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.floorNumber && <p className="text-red-500 text-xs mt-1">{errors.floorNumber.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Unit Number *</label>
                  <input
                    {...register("unitNumber", {
                      required: watchCompany === "Upvida" ? "Unit Number is required" : false,
                      minLength: { value: 1, message: "Unit Number must be at least 1 character" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.unitNumber ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.unitNumber && <p className="text-red-500 text-xs mt-1">{errors.unitNumber.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Building Number *</label>
                  <input
                    {...register("buildingNumber", {
                      required: watchCompany === "Upvida" ? "Building Number is required" : false,
                      minLength: { value: 1, message: "Building Number must be at least 1 character" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.buildingNumber ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.buildingNumber && <p className="text-red-500 text-xs mt-1">{errors.buildingNumber.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tower Number *</label>
                  <input
                    {...register("towerNumber", {
                      required: watchCompany === "Upvida" ? "Tower Number is required" : false,
                      minLength: { value: 1, message: "Tower Number must be at least 1 character" }
                    })}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground ${errors.towerNumber ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors.towerNumber && <p className="text-red-500 text-xs mt-1">{errors.towerNumber.message as string}</p>}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Identifier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {units.map((unit) => (
                    <tr key={unit._id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{unit.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {unit.company === "Sakaya" ? (
                          <div>
                            <div className="font-medium">{unit.unit}</div>
                            <div className="text-xs text-muted-foreground">Building {unit.building}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">Unit {unit.unitNumber}</div>
                            <div className="text-xs text-muted-foreground">Tower {unit.towerNumber} - Building {unit.buildingNumber}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {unit.company === "Sakaya" ? (
                          <div className="space-y-1">
                            <div>{unit.area}m² • {unit.bedrooms} BR</div>
                            <div className="text-xs text-muted-foreground">{unit.orientation}</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div>{unit.modelName} • Floor {unit.floorNumber}</div>
                            <div className="text-xs text-muted-foreground">{unit.totalArea}m² (Net: {unit.netArea}m²)</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {unit.company === "Sakaya" ? unit.price?.toLocaleString() : unit.totalPrice?.toLocaleString()}
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

