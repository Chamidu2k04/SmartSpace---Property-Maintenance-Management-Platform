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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Property & Lease Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage properties, monitor unit availability, and assign tenant leases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={store.isLoading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${store.isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setPropertyModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-blue-900 shadow-sm">
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Properties" value={store.properties.length} icon={Building2} color="#1E3A8A" />
        <Stat label="Total Units" value={units.length} icon={Home} color="#3B82F6" />
        <Stat label="Vacant Units" value={vacantUnits.length} icon={CheckCircle2} color="#10B981" />
        <Stat label="Active Leases" value={store.leases.filter((lease) => lease.isActive).length} icon={Users} color="#F59E0B" />
      </div>

      <div className="flex border-b border-gray-200 bg-white px-6 pt-3 rounded-xl shadow-sm overflow-x-auto">
        <Tab active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} icon={Building2}>Properties</Tab>
        <Tab active={activeTab === 'units'} onClick={() => setActiveTab('units')} icon={Home}>Units</Tab>
        <Tab active={activeTab === 'leases'} onClick={() => setActiveTab('leases')} icon={FileSignature}>Lease Agreements</Tab>
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
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h2 className="font-bold text-gray-900">Unit Directory</h2><p className="text-xs text-gray-500 mt-0.5">{units.length} of {allUnits.length} units displayed</p></div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filter} onChange={(event) => onFilter(event.target.value)} className="px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/15">
            {FILTERS.map((item) => <option key={item} value={item}>{item === 'All' ? 'All statuses' : item}</option>)}
          </select>
          <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg"><Plus className="w-4 h-4" /> Add Unit</button>
        </div>
      </div>
      {!units.length ? <EmptyState icon={Home} title="No units found" message={allUnits.length ? 'No units match the selected status.' : 'Add a property to register its first units.'} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100"><tr>{['Property', 'Unit', 'Floor', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{units.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-4 font-semibold text-sm text-gray-900">{unit.propertyName}</td>
                <td className="px-5 py-4 text-sm font-medium text-gray-700">{unit.unitNumber}</td>
                <td className="px-5 py-4 text-sm text-gray-600">Floor {unit.floor}</td>
                <td className="px-5 py-4"><Status status={unit.status} /></td>
                <td className="px-5 py-4"><RowActions onEdit={() => onEdit(unit)} onDelete={() => onDelete(unit)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LeasesPanel({ leases, onCreate, hasVacantUnits, onEdit, onTerminate, onDelete }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div><h2 className="font-bold text-gray-900">Lease Agreements</h2><p className="text-xs text-gray-500 mt-0.5">Tenant assignments and lease periods</p></div>
        <button onClick={onCreate} disabled={!hasVacantUnits} title={!hasVacantUnits ? 'A vacant unit is required' : undefined} className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50"><Plus className="w-4 h-4" /> Create Lease</button>
      </div>
      {!leases.length ? <EmptyState icon={FileSignature} title="No leases yet" message="Create a lease to assign a vacant unit to a tenant." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100"><tr>{['Tenant', 'Property & Unit', 'Lease Period', 'Monthly Rent', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{leases.map((lease) => (
              <tr key={lease.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-4"><p className="text-sm font-semibold text-gray-900">{lease.tenantName}</p><p className="text-xs text-gray-500">{lease.tenantEmail}</p></td>
                <td className="px-5 py-4"><p className="text-sm font-medium text-gray-800">{lease.propertyName}</p><p className="text-xs text-gray-500">Unit {lease.unitNumber}</p></td>
                <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">{formatDate(lease.startDate)} - {formatDate(lease.endDate)}</td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-800 whitespace-nowrap">Rs. {Number(lease.monthlyRent).toLocaleString()}</td>
                <td className="px-5 py-4"><Status status={lease.isActive ? 'Active' : 'Inactive'} /></td>
                <td className="px-5 py-4"><div className="flex gap-1"><button title="Edit lease" onClick={() => onEdit(lease)} className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>{lease.isActive ? <button title="Terminate lease" onClick={() => onTerminate(lease)} className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg"><Ban className="w-4 h-4" /></button> : <button title="Delete lease" onClick={() => onDelete(lease)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PropertiesPanel({ properties, onView, onEdit, onDelete }) {
  return <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">{!properties.length ? <EmptyState icon={Building2} title="No properties yet" message="Add your first property to begin managing units." /> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50/80 border-b border-gray-100"><tr>{['Property', 'Address', 'Units', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{properties.map((property) => <tr key={property.id} className="hover:bg-gray-50/60"><td className="px-5 py-4 font-semibold text-sm text-gray-900">{property.name}</td><td className="px-5 py-4 text-sm text-gray-600">{property.address}, {property.city}</td><td className="px-5 py-4 text-sm text-gray-600">{property.units?.length || 0}</td><td className="px-5 py-4"><div className="flex gap-1"><button title="View property" onClick={() => onView(property)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button><RowActions onEdit={() => onEdit(property)} onDelete={() => onDelete(property)} /></div></td></tr>)}</tbody></table></div>}</section>;
}

function PropertyDetails({ property, onClose }) { return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"><div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden"><div className="p-6 border-b border-gray-100 flex justify-between"><div><h2 className="text-xl font-bold text-gray-900">{property.name}</h2><p className="text-sm text-gray-500 mt-1">{property.address}, {property.city}</p></div><button onClick={onClose} className="text-gray-500">Close</button></div><div className="p-6"><h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Registered Units</h3><div className="space-y-2">{property.units?.length ? property.units.map((unit) => <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm font-semibold text-gray-800">Unit {unit.unitNumber} - Floor {unit.floor}</span><Status status={unit.status} /></div>) : <p className="text-sm text-gray-500">No units registered.</p>}</div></div></div></div>; }

function RowActions({ onEdit, onDelete }) { return <div className="flex gap-1"><button title="Edit" onClick={onEdit} className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button><button title="Delete" onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>; }

function AccessRestricted({ role }) { return <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-8 text-center max-w-2xl mx-auto my-8"><div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 mb-4"><ShieldAlert className="w-8 h-8" /></div><h2 className="text-xl font-bold text-gray-900">Access Restricted</h2><p className="text-sm text-gray-600 mt-2">Property and lease management is available only to Property Manager accounts.</p><span className="inline-flex mt-5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">Current role: {role || 'Guest'}</span></div>; }
function ErrorState({ error, retry }) { return <div className="bg-white rounded-xl border border-red-100 shadow-sm p-10 text-center"><AlertTriangle className="w-9 h-9 text-red-500 mx-auto mb-3" /><h3 className="font-bold text-gray-900">Unable to load property data</h3><p className="text-sm text-gray-500 mt-1 mb-4">{error.message}</p><button onClick={retry} className="px-4 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg">Try Again</button></div>; }
function LoadingState() { return <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 flex items-center justify-center gap-3 text-gray-500"><Loader2 className="w-5 h-5 animate-spin text-[#1E3A8A]" /> Loading property data...</div>; }
function Stat({ label, value, icon: Icon, color }) { return <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"><div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}10`, color }}><Icon className="w-5 h-5" /></div><div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p><p className="text-2xl font-bold text-gray-900">{value}</p></div></div>; }
function Tab({ active, onClick, icon: Icon, children }) { return <button onClick={onClick} className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap ${active ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Icon className="w-4 h-4" />{children}</button>; }
function Status({ status }) { const colors = { Vacant: 'bg-emerald-50 text-emerald-700 border-emerald-200', Occupied: 'bg-blue-50 text-blue-700 border-blue-200', Maintenance: 'bg-amber-50 text-amber-700 border-amber-200', Active: 'bg-emerald-50 text-emerald-700 border-emerald-200', Inactive: 'bg-gray-100 text-gray-600 border-gray-200' }; return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.Inactive}`}>{status}</span>; }
function EmptyState({ icon: Icon, title, message }) { return <div className="py-16 text-center"><div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center mx-auto mb-3"><Icon className="w-6 h-6" /></div><h3 className="font-semibold text-gray-900">{title}</h3><p className="text-sm text-gray-500 mt-1">{message}</p></div>; }
function formatDate(value) { return new Intl.DateTimeFormat('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)); }
