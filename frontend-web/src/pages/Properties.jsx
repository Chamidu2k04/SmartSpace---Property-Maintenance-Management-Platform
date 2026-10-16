import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, Building2, CheckCircle2, Edit3, Eye, FileSignature, Filter, Home, Loader2, Plus, RefreshCw, ShieldAlert, Trash2, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { usePropertyStore } from '../store/usePropertyStore';
import PropertyModal from '../components/property/PropertyModal';
import LeaseModal from '../components/property/LeaseModal';
import UnitModal from '../components/property/UnitModal';
import PropertyEditModal from '../components/property/PropertyEditModal';
import { propertyService } from '../services/propertyService';

const FILTERS = ['All', 'Vacant', 'Occupied', 'Maintenance'];

export default function Properties() {
  const { user } = useAuthStore();
  const store = usePropertyStore();
  const loadData = store.loadData;
  const [activeTab, setActiveTab] = useState('units');
  const [statusFilter, setStatusFilter] = useState('All');
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [unitModal, setUnitModal] = useState({ open: false, unit: null });
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingLease, setEditingLease] = useState(null);
  const [viewingProperty, setViewingProperty] = useState(null);
  const isManager = user?.role === 'PropertyManager';

  useEffect(() => {
    if (isManager) loadData();
  }, [isManager, loadData]);

  const units = useMemo(() => store.properties.flatMap((property) =>
    (property.units || []).map((unit) => ({ ...unit, propertyName: unit.propertyName || property.name }))), [store.properties]);
  const visibleUnits = statusFilter === 'All' ? units : units.filter((unit) => unit.status === statusFilter);
  const vacantUnits = units.filter((unit) => unit.status === 'Vacant');

  const confirmAndRun = async (message, operation) => {
    if (!window.confirm(message)) return;
    try { await store.runMutation(operation); }
    catch (error) { window.alert(error.message || 'The operation could not be completed.'); }
  };

  if (!isManager) {
    return <AccessRestricted role={user?.role} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Building2 className="w-3.5 h-3.5" /> Real Estate Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">Property & Lease Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage physical properties, monitor unit availability, and administer tenant leases</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={loadData} 
            disabled={store.isLoading} 
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${store.isLoading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} /> 
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setPropertyModalOpen(true)} 
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" /> 
            <span>Add Property</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Properties" value={store.properties.length} icon={Building2} color="#2563eb" bg="bg-blue-50" text="text-blue-600" />
        <Stat label="Total Units" value={units.length} icon={Home} color="#0284c7" bg="bg-sky-50" text="text-sky-600" />
        <Stat label="Vacant Units" value={vacantUnits.length} icon={CheckCircle2} color="#059669" bg="bg-emerald-50" text="text-emerald-600" />
        <Stat label="Active Leases" value={store.leases.filter((lease) => lease.isActive).length} icon={Users} color="#d97706" bg="bg-amber-50" text="text-amber-600" />
      </div>

      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-slate-200/60 max-w-full overflow-x-auto">
        <Tab active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} icon={Building2}>Properties ({store.properties.length})</Tab>
        <Tab active={activeTab === 'units'} onClick={() => setActiveTab('units')} icon={Home}>Units ({units.length})</Tab>
        <Tab active={activeTab === 'leases'} onClick={() => setActiveTab('leases')} icon={FileSignature}>Lease Agreements ({store.leases.length})</Tab>
      </div>

      {store.error ? <ErrorState error={store.error} retry={loadData} />
        : store.isLoading ? <LoadingState />
          : activeTab === 'properties' ? <PropertiesPanel properties={store.properties} onView={async (property) => { try { setViewingProperty(await propertyService.getProperty(property.id)); } catch (error) { window.alert(error.message); } }} onEdit={setEditingProperty} onDelete={(property) => confirmAndRun(`Delete ${property.name}? This cannot be undone.`, () => propertyService.deleteProperty(property.id))} />
            : activeTab === 'units' ? <UnitsPanel units={visibleUnits} allUnits={units} filter={statusFilter} onFilter={setStatusFilter} onAdd={() => setUnitModal({ open: true, unit: null })} onEdit={(unit) => setUnitModal({ open: true, unit })} onDelete={(unit) => confirmAndRun(`Delete unit ${unit.unitNumber}? This cannot be undone.`, () => propertyService.deleteUnit(unit.id))} />
              : <LeasesPanel leases={store.leases} onCreate={() => setLeaseModalOpen(true)} hasVacantUnits={vacantUnits.length > 0} onEdit={setEditingLease} onTerminate={(lease) => confirmAndRun(`Terminate the lease for ${lease.tenantName}?`, () => propertyService.terminateLease(lease.id))} onDelete={(lease) => confirmAndRun('Delete this inactive lease permanently?', () => propertyService.deleteLease(lease.id))} />}

      <PropertyModal isOpen={propertyModalOpen} onClose={() => setPropertyModalOpen(false)} onSubmit={store.createProperty} isSaving={store.isSaving} />
      <LeaseModal isOpen={leaseModalOpen} onClose={() => setLeaseModalOpen(false)} onSubmit={store.createLease} units={vacantUnits} tenants={store.tenants} isSaving={store.isSaving} />
      <LeaseModal isOpen={Boolean(editingLease)} lease={editingLease} onClose={() => setEditingLease(null)} onSubmit={(data) => store.runMutation(() => propertyService.updateLease(editingLease.id, data))} units={vacantUnits} tenants={store.tenants} isSaving={store.isSaving} />
      <UnitModal isOpen={unitModal.open} unit={unitModal.unit} properties={store.properties} onClose={() => setUnitModal({ open: false, unit: null })} onSubmit={(data) => store.runMutation(() => unitModal.unit ? propertyService.updateUnit(unitModal.unit.id, data) : propertyService.addUnit(data.propertyId, { unitNumber: data.unitNumber, floor: data.floor, status: data.status }))} isSaving={store.isSaving} />
      <PropertyEditModal property={editingProperty} onClose={() => setEditingProperty(null)} onSubmit={(data) => store.runMutation(() => propertyService.updateProperty(editingProperty.id, data))} isSaving={store.isSaving} />
      {viewingProperty && <PropertyDetails property={viewingProperty} onClose={() => setViewingProperty(null)} />}
    </div>
  );
}

function UnitsPanel({ units, allUnits, filter, onFilter, onAdd, onEdit, onDelete }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Unit Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">{units.length} of {allUnits.length} units displayed</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={filter} 
              onChange={(event) => onFilter(event.target.value)} 
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              {FILTERS.map((item) => <option key={item} value={item}>{item === 'All' ? 'All statuses' : item}</option>)}
            </select>
          </div>
          <button 
            onClick={onAdd} 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Unit
          </button>
        </div>
      </div>
      {!units.length ? (
        <EmptyState icon={Home} title="No units found" message={allUnits.length ? 'No units match the selected status.' : 'Add a property to register its first units.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Property', 'Unit', 'Floor', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-sm text-slate-900">{unit.propertyName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">Unit {unit.unitNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">Floor {unit.floor}</td>
                  <td className="px-6 py-4"><Status status={unit.status} /></td>
                  <td className="px-6 py-4"><RowActions onEdit={() => onEdit(unit)} onDelete={() => onDelete(unit)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LeasesPanel({ leases, onCreate, hasVacantUnits, onEdit, onTerminate, onDelete }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Lease Agreements</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tenant assignments and lease terms</p>
        </div>
        <button 
          onClick={onCreate} 
          disabled={!hasVacantUnits} 
          title={!hasVacantUnits ? 'A vacant unit is required' : undefined} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          <Plus className="w-3.5 h-3.5" /> Create Lease
        </button>
      </div>
      {!leases.length ? (
        <EmptyState icon={FileSignature} title="No leases yet" message="Create a lease to assign a vacant unit to a tenant." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Tenant', 'Property & Unit', 'Lease Period', 'Monthly Rent', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leases.map((lease) => (
                <tr key={lease.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">{lease.tenantName}</p>
                    <p className="text-xs text-slate-400">{lease.tenantEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{lease.propertyName}</p>
                    <p className="text-xs text-slate-400">Unit {lease.unitNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                    {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                    Rs. {Number(lease.monthlyRent).toLocaleString()}
                  </td>
                  <td className="px-6 py-4"><Status status={lease.isActive ? 'Active' : 'Inactive'} /></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <button title="Edit lease" onClick={() => onEdit(lease)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {lease.isActive ? (
                        <button title="Terminate lease" onClick={() => onTerminate(lease)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button title="Delete lease" onClick={() => onDelete(lease)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PropertiesPanel({ properties, onView, onEdit, onDelete }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {!properties.length ? (
        <EmptyState icon={Building2} title="No properties yet" message="Add your first property to begin managing units." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Property', 'Address', 'Units', 'Actions'].map((heading) => (
                  <th key={heading} className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      {property.imageUrl ? (
                        <img src={property.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200/60 shadow-xs" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/60 text-slate-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{property.name}</span>
                        <span className="text-xs text-slate-400 block sm:hidden">{property.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{property.address}, {property.city}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {property.units?.length || 0} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <button title="View property" onClick={() => onView(property)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <RowActions onEdit={() => onEdit(property)} onDelete={() => onDelete(property)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PropertyDetails({ property, onClose }) { 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {property.imageUrl && (
          <img src={property.imageUrl} alt={property.name} className="w-full h-56 object-cover" />
        )}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">{property.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{property.address}, {property.city}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
        <div className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Registered Units</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {property.units?.length ? property.units.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-sm font-semibold text-slate-800">Unit {unit.unitNumber} - Floor {unit.floor}</span>
                <Status status={unit.status} />
              </div>
            )) : (
              <p className="text-sm text-slate-500 py-4 text-center">No units registered for this property.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  ); 
}

function RowActions({ onEdit, onDelete }) { 
  return (
    <div className="flex gap-1.5">
      <button title="Edit" onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
        <Edit3 className="w-4 h-4" />
      </button>
      <button title="Delete" onClick={onDelete} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  ); 
}

function AccessRestricted({ role }) { 
  return (
    <div className="bg-white rounded-3xl shadow-xs border border-amber-100 p-8 sm:p-12 text-center max-w-2xl mx-auto my-12">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 mb-4 border border-amber-100">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
      <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">Property and lease management is available only to Property Manager accounts.</p>
      <span className="inline-flex mt-5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
        Current role: {role || 'Guest'}
      </span>
    </div>
  ); 
}

function ErrorState({ error, retry }) { 
  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-10 text-center">
      <AlertTriangle className="w-9 h-9 text-rose-500 mx-auto mb-3" />
      <h3 className="font-bold text-slate-900">Unable to load property data</h3>
      <p className="text-sm text-slate-500 mt-1 mb-4">{error.message}</p>
      <button onClick={retry} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors">
        Try Again
      </button>
    </div>
  ); 
}

function LoadingState() { 
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs py-20 flex items-center justify-center gap-3 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> 
      <span>Loading property data...</span>
    </div>
  ); 
}

function Stat({ label, value, icon: Icon, bg, text }) { 
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${text} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  ); 
}

function Tab({ active, onClick, icon: Icon, children }) { 
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
        active 
          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60' 
          : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  ); 
}

function Status({ status }) { 
  const colors = { 
    Vacant: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', 
    Occupied: 'bg-blue-50 text-blue-700 border-blue-200/80', 
    Maintenance: 'bg-amber-50 text-amber-700 border-amber-200/80', 
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', 
    Inactive: 'bg-slate-100 text-slate-600 border-slate-200' 
  }; 
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || colors.Inactive}`}>
      {status}
    </span>
  ); 
}

function EmptyState({ icon: Icon, title, message }) { 
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-slate-800 text-base">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
    </div>
  ); 
}

function formatDate(value) { 
  return new Intl.DateTimeFormat('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)); 
}
