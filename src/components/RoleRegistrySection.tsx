/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, deleteField } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Shield,
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  Users,
  Briefcase,
  PlusCircle,
  ShieldCheck,
  Eye,
  Settings,
  Info,
  Layers,
  Key,
  Edit2,
  X
} from 'lucide-react';
import { CustomRole, DEFAULT_CUSTOM_ROLES } from '../types';
import { useConfirm } from './ConfirmDialog';

interface RoleRegistrySectionProps {
  currentUserEmail: string | null;
  currentUserRole: string;
  customRoles: CustomRole[];
  onRolesUpdated: (updatedRoles: CustomRole[]) => void;
}

interface UserRoleEntry {
  email: string;
  role: string;
}

const SYSTEM_TABS = [
  { id: 'overview-section', label: 'Overview Dashboard' },
  { id: 'theme-section', label: 'Theme & Settings' },
  { id: 'company-info-section', label: 'About Company Copy' },
  { id: 'hero-section', label: 'Hero Content' },
  { id: 'services-section', label: 'What We Offer (Services List)' },
  { id: 'products-section', label: 'Product Range' },
  { id: 'logistics-section', label: 'Logistics Tracker' },
  { id: 'why-choose-section', label: 'Why Choose Us' },
  { id: 'process-section', label: 'How It Works (Steps)' },
  { id: 'contact-section', label: 'Contact Details' },
  { id: 'announcements-section', label: 'Announcements' },
  { id: 'leads-section', label: 'Chat Leads' },
  { id: 'role-registry-section', label: 'Role Registry' },
  { id: 'domain-management', label: 'Domain Management' },
];

export default function RoleRegistrySection({
  currentUserEmail,
  currentUserRole,
  customRoles,
  onRolesUpdated
}: RoleRegistrySectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'designations' | 'roles'>('designations');
  const [usersList, setUsersList] = useState<UserRoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form inputs for Registering a Designation
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');

  // Editing states for designations (mapped users)
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');

  // Form inputs for Custom Role Creator
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedTabs, setSelectedTabs] = useState<string[]>(['overview-section']);

  // Editing state for custom roles
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  const isDeveloper = currentUserRole === 'Developer';
  const { confirm } = useConfirm();

  // Reset editing states on subtab switch
  useEffect(() => {
    setEditingEmail(null);
    setEditingRole(null);
  }, [activeSubTab]);

  // Load custom role details into form when editing custom roles
  useEffect(() => {
    if (editingRole) {
      setRoleName(editingRole.name);
      setRoleDesc(editingRole.description);
      setSelectedTabs(editingRole.allowedTabs);
    } else {
      setRoleName('');
      setRoleDesc('');
      setSelectedTabs(['overview-section']);
    }
  }, [editingRole]);

  // Initialize newRole to the first customRole once loaded
  useEffect(() => {
    if (customRoles && customRoles.length > 0 && !newRole) {
      setNewRole(customRoles[0].name);
    }
  }, [customRoles, newRole]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db, 'siteConfig', 'userRoles'));
      const list: UserRoleEntry[] = [];
      if (snap.exists()) {
        const data = snap.data();
        Object.entries(data).forEach(([email, role]) => {
          if (typeof role === 'string') {
            list.push({ email, role });
          }
        });
      }

      // Ensure the default developer is in the list
      if (!list.some(u => u.email.toLowerCase() === 'sanjoobjayamohan@gmail.com')) {
        list.push({ email: 'sanjoobjayamohan@gmail.com', role: 'Developer' });
      }

      setUsersList(list);
    } catch (err) {
      console.warn('Error fetching registered users:', err);
      // Fallback list
      setUsersList([{ email: 'sanjoobjayamohan@gmail.com', role: 'Developer' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      setError('Only a Developer can register new designations.');
      return;
    }

    const emailKey = newEmail.trim().toLowerCase();
    if (!emailKey) return;

    confirm({
      title: 'Assign Designation',
      message: `Are you sure you want to assign the role "${newRole}" to ${emailKey}? This will write the configuration changes to Firestore.`,
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
          try {
            await setDoc(doc(db, 'siteConfig', 'userRoles'), {
              [emailKey]: newRole
            }, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, `siteConfig/userRoles/${emailKey}`);
          }

          setSuccessMsg(`Successfully registered designation for ${emailKey}`);
          setNewEmail('');
          fetchUsers();
        } catch (err) {
          console.error('Error registering role:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleDeleteUser = (email: string) => {
    if (!isDeveloper) {
      setError('Only a Developer can delete designations.');
      return;
    }

    if (email.toLowerCase() === 'sanjoobjayamohan@gmail.com') {
      alert('You cannot delete the primary Developer account.');
      return;
    }

    confirm({
      title: 'Remove Designation',
      message: `Are you sure you want to remove the designation and role assignments for ${email}?`,
      type: 'delete',
      onConfirm: async () => {
        setDeleting(email);
        setError(null);
        setSuccessMsg(null);
        try {
          try {
            await setDoc(doc(db, 'siteConfig', 'userRoles'), {
              [email]: deleteField()
            }, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.DELETE, `siteConfig/userRoles/${email}`);
          }
          setSuccessMsg(`Removed designation for ${email}`);
          fetchUsers();
        } catch (err) {
          console.error('Error removing role:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setDeleting(null);
        }
      }
    });
  };

  const handleSaveDesignationEdit = async (email: string) => {
    if (!isDeveloper) {
      setError('Only a Developer can edit designations.');
      return;
    }

    confirm({
      title: 'Update Designation',
      message: `Are you sure you want to update the designation for ${email} to "${editRole}"? This will write changes to Firestore.`,
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
          try {
            await setDoc(doc(db, 'siteConfig', 'userRoles'), {
              [email]: editRole
            }, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, `siteConfig/userRoles/${email}`);
          }

          setSuccessMsg(`Successfully updated designation for ${email} to ${editRole}`);
          setEditingEmail(null);
          fetchUsers();
        } catch (err) {
          console.error('Error updating designation:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const saveCustomRolesToFirestore = async (updatedRoles: CustomRole[]) => {
    try {
      await setDoc(doc(db, 'siteConfig', 'rolesConfig'), {
        roles: updatedRoles,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      onRolesUpdated(updatedRoles);
    } catch (dbErr) {
      handleFirestoreError(dbErr, OperationType.WRITE, 'siteConfig/rolesConfig');
    }
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      setError('Only a Developer can create custom roles.');
      return;
    }

    const trimmedName = roleName.trim();
    if (!trimmedName) return;

    // Check if role name already exists (case-insensitive check)
    if (customRoles.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError(`A role named "${trimmedName}" already exists.`);
      return;
    }

    confirm({
      title: 'Create Custom Role',
      message: `Are you sure you want to create and save the custom role "${trimmedName}" with the selected tab access?`,
      type: 'save',
      onConfirm: async () => {
        const newCustomRole: CustomRole = {
          name: trimmedName,
          description: roleDesc.trim() || 'Custom user role.',
          allowedTabs: selectedTabs
        };

        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        const updatedRoles = [...customRoles, newCustomRole];
        try {
          await saveCustomRolesToFirestore(updatedRoles);
          setSuccessMsg(`Successfully created completely custom role "${trimmedName}"!`);
          setRoleName('');
          setRoleDesc('');
          setSelectedTabs(['overview-section']);
        } catch (err) {
          console.error('Error creating custom role:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      setError('Only a Developer can update custom roles.');
      return;
    }
    if (!editingRole) return;

    confirm({
      title: 'Update Custom Role',
      message: `Are you sure you want to update the custom role "${editingRole.name}" with the selected description and tab access?`,
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        const updatedRoles = customRoles.map(r => 
          r.name.toLowerCase() === editingRole.name.toLowerCase()
            ? { ...r, description: roleDesc.trim() || 'Custom user role.', allowedTabs: selectedTabs }
            : r
        );

        try {
          await saveCustomRolesToFirestore(updatedRoles);
          setSuccessMsg(`Successfully updated custom role "${editingRole.name}"!`);
          setEditingRole(null);
        } catch (err) {
          console.error('Error updating custom role:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleDeleteRole = (roleNameToDelete: string) => {
    if (!isDeveloper) {
      setError('Only a Developer can delete custom roles.');
      return;
    }

    const isSystemPreset = ['developer', 'admin', 'employee', 'sales associate', 'marketing associate'].includes(roleNameToDelete.toLowerCase());
    if (isSystemPreset) {
      alert('System preset roles cannot be deleted to maintain platform integrity.');
      return;
    }

    confirm({
      title: 'Delete Custom Role',
      message: `Are you sure you want to completely delete the custom role "${roleNameToDelete}"? Active users with this role will fall back to employee privileges.`,
      type: 'delete',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        const updatedRoles = customRoles.filter(r => r.name !== roleNameToDelete);
        try {
          await saveCustomRolesToFirestore(updatedRoles);
          setSuccessMsg(`Deleted custom role "${roleNameToDelete}" successfully.`);
          // If the deleted role was selected in designation mapper, reset it
          if (newRole === roleNameToDelete) {
            setNewRole(updatedRoles[0]?.name || 'Employee');
          }
        } catch (err) {
          console.error('Error deleting custom role:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleToggleTab = (tabId: string) => {
    if (selectedTabs.includes(tabId)) {
      if (selectedTabs.length > 1) {
        setSelectedTabs(selectedTabs.filter(id => id !== tabId));
      }
    } else {
      setSelectedTabs([...selectedTabs, tabId]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      
      {/* Header Info Banner */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-2xl">
              <Shield className="w-6 h-6" />
            </div>
            Access Control & Role Registry
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xl leading-relaxed">
            Configure completely custom enterprise roles, configure exact feature permissions, and assign emails to roles dynamically.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/60 p-1 rounded-2xl self-start md:self-center shrink-0">
          <button
            onClick={() => setActiveSubTab('designations')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'designations'
                ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Designations Directory
          </button>
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'roles'
                ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Role Creator & Permissions
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold">Operation Error</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold">Success</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">{successMsg}</p>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: DESIGNATIONS DIRECTORY (MAPS USERS TO ROLES) */}
      {activeSubTab === 'designations' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* left panel: register form */}
          <div className="md:col-span-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Register User Designation
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
              Map an employee email address to any available system role to assign system permissions.
            </p>

            {isDeveloper ? (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    User Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="employee@stonex.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Designation / Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white outline-none cursor-pointer"
                  >
                    {customRoles.map((role) => (
                      <option key={role.name} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-75 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Assign Designation</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl text-amber-700 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Developer restriction:</strong> Registering and mapping user designations can only be performed by a Developer account. Your current role is <strong>{currentUserRole}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* right panel: designations list */}
          <div className="md:col-span-7 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Designation Registry
              </h3>
              <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-[10px] font-extrabold uppercase tracking-wider rounded-lg">
                {usersList.length} Accounts
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                <span className="text-xs font-bold">Loading active registries...</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-750 max-h-[400px] overflow-y-auto pr-1">
                {usersList.map((userEntry) => {
                  const roleDetail = customRoles.find(r => r.name.toLowerCase() === userEntry.role.toLowerCase());
                  const isEditing = editingEmail === userEntry.email;
                  
                  return (
                    <div key={userEntry.email} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-750/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 truncate">
                          {userEntry.email}
                        </p>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
                            >
                              {customRoles.map((role) => (
                                <option key={role.name} value={role.name}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-1 text-slate-400 dark:text-slate-500">
                            <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-medium">{userEntry.role}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {!isEditing && (
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            userEntry.role === 'Developer'
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'
                              : userEntry.role === 'Admin'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                              : userEntry.role === 'Sales Associate'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                              : userEntry.role === 'Marketing Associate'
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/50'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {userEntry.role}
                          </span>
                        )}

                        {isDeveloper && userEntry.email.toLowerCase() !== 'sanjoobjayamohan@gmail.com' && (
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveDesignationEdit(userEntry.email)}
                                  disabled={saving}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                                  title="Save Changes"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmail(null)}
                                  disabled={saving}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel Edit"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEmail(userEntry.email);
                                    setEditRole(userEntry.role);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer active:scale-90"
                                  title="Edit Designation"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(userEntry.email)}
                                  disabled={deleting === userEntry.email}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer active:scale-90"
                                  title="Remove Account"
                                >
                                  {deleting === userEntry.email ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ENTERPRISE ROLE CREATOR */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Left panel: Create/Edit Custom Role Form */}
          <div className="md:col-span-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              {editingRole ? (
                <Edit2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              ) : (
                <PlusCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              )}
              {editingRole ? `Edit Custom Role: ${editingRole.name}` : 'Create Custom Role'}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
              {editingRole 
                ? `Update permissions and description details for the "${editingRole.name}" designation.`
                : 'Establish a completely custom brand designation and selectively allow or restrict access to specific administration tabs.'}
            </p>

            {isDeveloper ? (
              <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Role Name</span>
                    {editingRole && (
                      <span className="text-[9px] text-slate-400 font-bold lowercase italic">(names are permanent identifiers)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Operations Manager"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Role Description
                  </label>
                  <textarea
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="e.g. In charge of material dispatches, carrier keys, and tracking logs."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm min-h-[70px] outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Feature / Screen Permissions</span>
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-extrabold uppercase">
                      {selectedTabs.length} Selected
                    </span>
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-[220px] overflow-y-auto space-y-2">
                    {SYSTEM_TABS.map((tab) => {
                      const isSelected = selectedTabs.includes(tab.id);
                      return (
                        <div
                          key={tab.id}
                          onClick={() => handleToggleTab(tab.id)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-violet-50/60 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-400 shadow-xs'
                              : 'bg-white dark:bg-slate-850 border-slate-150 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded text-violet-600 border-slate-300 dark:border-slate-750 pointer-events-none"
                          />
                          <span>{tab.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  {editingRole && (
                    <button
                      type="button"
                      onClick={() => setEditingRole(null)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving || !roleName}
                    className={`font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.98] ${
                      editingRole ? 'flex-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3' : 'w-full bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-75 py-3'
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        {editingRole ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                        <span>{editingRole ? 'Save Changes' : 'Create Custom Role'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl text-amber-700 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Developer restriction:</strong> Creating completely custom roles can only be performed by a Developer account. Your current role is <strong>{currentUserRole}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Right panel: Roles Catalog */}
          <div className="md:col-span-7 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                System Roles Catalog
              </h3>
              <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-[10px] font-extrabold uppercase tracking-wider rounded-lg">
                {customRoles.length} Active Roles
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {customRoles.map((role) => {
                const isPreset = ['developer', 'admin', 'employee', 'sales associate', 'marketing associate'].includes(role.name.toLowerCase());
                const mappedCount = usersList.filter(u => u.role.toLowerCase() === role.name.toLowerCase()).length;

                return (
                  <div key={role.name} className="border border-slate-150 dark:border-slate-750 rounded-2xl p-4 space-y-3 hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                          {role.name}
                        </span>
                        {isPreset ? (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[8px] font-extrabold uppercase tracking-widest rounded-md">
                            Preset
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border border-violet-200/50 dark:border-violet-900/50 text-[8px] font-extrabold uppercase tracking-widest rounded-md">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">
                          {mappedCount} mapped user{mappedCount === 1 ? '' : 's'}
                        </span>
                        {!isPreset && isDeveloper && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingRole(role)}
                              disabled={saving}
                              className={`p-1 rounded-md cursor-pointer transition-colors ${
                                editingRole?.name === role.name
                                  ? 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400'
                                  : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                              }`}
                              title="Edit Custom Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role.name)}
                              disabled={saving}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-md cursor-pointer transition-colors"
                              title="Delete Custom Role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {role.description}
                    </p>

                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Key className="w-3 h-3 text-violet-500" />
                        Allowed Screens ({role.allowedTabs.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {role.allowedTabs.map(tabId => {
                          const tabName = SYSTEM_TABS.find(t => t.id === tabId)?.label || tabId;
                          return (
                            <span key={tabId} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-450 rounded-lg border border-slate-100 dark:border-slate-800">
                              {tabName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
