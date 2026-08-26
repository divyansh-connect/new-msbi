import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { useRBAC } from '../context/RBACContext';
import { UserRole } from '../types/crm';
import { navStructure } from '../config/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

interface UserMember {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Pending';
}

const subViewTitles: Record<string, { title: string; subtitle: string }> = {
  'users': { title: 'Active Team & Staff Directory', subtitle: 'Manage staff user profiles, role assignments, and pending invitations.' },
  'departments': { title: 'Clinical & Marketing Departments Roster', subtitle: 'Practice department organization, department heads, and member count.' },
  'permissions': { title: 'Granular Role-Based Access Control (RBAC)', subtitle: 'Configure feature access switches and permission matrix per role.' },
  'activity-logs': { title: 'System Activity & Security Audit Trail', subtitle: 'Audit log of user events, budget modifications, and security actions.' },
};

export const UsersAndRoles: React.FC = () => {
  const { subview } = useParams<{ subview?: string }>();
  const { roles, permissionsMatrix, systemRoles, togglePermission, addRole, deleteRole } = useRBAC();
  const queryClient = useQueryClient();

  const { data: userList = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: any[] }>('/users');
      return res.data.map((u: any) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role || 'Manager',
        department: u.department || 'Executive Board',
        status: u.isActive ? 'Active' : 'Pending'
      })) as UserMember[];
    }
  });

  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const { showSuccess, showError, showConfirm } = useToast();

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteFirstName, setInviteFirstName] = useState<string>('');
  const [inviteLastName, setInviteLastName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Manager');
  const [inviteDepartment, setInviteDepartment] = useState<string>('Marketing Ops');

  const [actionType, setActionType] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserMember | null>(null);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Manager');
  const [editDepartment, setEditDepartment] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Pending'>('Active');

  // We now fetch from API, so no local userList state is needed.

  const activeSubViewKey = subview || 'users';
  const meta = subViewTitles[activeSubViewKey] || subViewTitles['users'];

  const inviteMutation = useMutation({
    mutationFn: (newUser: any) => apiClient('/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      showSuccess('Invitation sent successfully!');
    },
    onError: (err: any) => {
      showError('Failed to send invitation: ' + err.message);
    }
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName || inviteMutation.isPending) return;
    inviteMutation.mutate({
      firstName: inviteFirstName,
      lastName: inviteLastName,
      email: inviteEmail,
      password: 'TemporaryPassword123!', // Required by backend
      role: inviteRole,
      department: inviteDepartment,
      isActive: true
    });
  };

  const openActionModal = (type: 'view' | 'edit' | 'delete', user: UserMember) => {
    setActionType(type);
    setSelectedUser(user);
    if (type === 'edit') {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditRole(user.role);
      setEditDepartment(user.department);
      setEditStatus(user.status);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (updateUser: any) => apiClient(`/users/${updateUser.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateUser)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setActionType(null);
      showSuccess('User profile updated successfully!');
    },
    onError: (err: any) => {
      showError('Failed to update user profile: ' + err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setActionType(null);
      showSuccess('User deleted successfully!');
    },
    onError: (err: any) => {
      showError('Failed to delete user: ' + err.message);
    }
  });

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && !updateMutation.isPending) {
      const [firstName, ...lastNameArr] = editName.split(' ');
      const lastName = lastNameArr.join(' ');
      updateMutation.mutate({
        id: selectedUser.id,
        firstName,
        lastName,
        email: editEmail,
        role: editRole,
        department: editDepartment,
        isActive: editStatus === 'Active'
      });
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser && !deleteMutation.isPending) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-headline-lg text-lg sm:text-xl md:text-2xl text-primary font-bold leading-tight">
              {meta.title}
            </h1>
            
          </div>
          <p className="font-body-md text-on-surface-variant text-xs mt-1">
            {meta.subtitle}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary-vibrant font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Render Dedicated Submenu Content View */}
      {activeSubViewKey === 'activity-logs' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border-subtle">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">System Activity Audit Trail</h2>
          </div>
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">User</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Action Event</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Module</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">IP Address</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {[
                  { user: 'Dr. Marcus Vance', action: 'Updated Q3 Budget Allocation ($1.25M)', module: 'Budget Management', ip: '192.168.1.42', time: 'Aug 10 10:14 AM' },
                  { user: 'Sarah Jenkins', action: 'Created New Campaign "Spine Push"', module: 'Campaigns', ip: '192.168.1.88', time: 'Aug 10 09:30 AM' },
                  { user: 'Elena Rostova', action: 'Responded to 5-Star Patient Review', module: 'Reputation', ip: '192.168.1.15', time: 'Aug 09 04:12 PM' },
                ].map((log, idx) => (
                  <tr key={idx} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-bold text-primary whitespace-nowrap">{log.user}</td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-on-surface whitespace-nowrap">{log.action}</td>
                    <td className="py-3 px-3 sm:px-4 text-secondary font-medium whitespace-nowrap">{log.module}</td>
                    <td className="py-3 px-3 sm:px-4 font-data-mono whitespace-nowrap">{log.ip}</td>
                    <td className="py-3 px-3 sm:px-4 text-on-surface-variant whitespace-nowrap">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubViewKey === 'departments' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary border-b border-border-subtle pb-3">
            MSBI Clinical & Marketing Departments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
            {[
              { dept: 'Executive Board', head: 'Dr. Marcus Vance', count: '4 Members' },
              { dept: 'Marketing Ops', head: 'Sarah Jenkins', count: '8 Members' },
              { dept: 'Neurology Program', head: 'Dr. Elena Rostova', count: '12 Members' },
            ].map((d, idx) => (
              <div key={idx} className="p-3.5 border border-border-subtle rounded-xl bg-surface-muted space-y-1">
                <p className="font-bold text-primary text-xs sm:text-sm">{d.dept}</p>
                <p className="text-on-surface-variant">Lead: {d.head}</p>
                <p className="text-xs font-bold text-secondary pt-1">{d.count}</p>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubViewKey === 'permissions' ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
          <div className="border-b border-border-subtle pb-3 flex justify-between items-center">
            <div>
              <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Granular Role Permissions Matrix</h2>
              <p className="text-xs text-on-surface-variant">Configure system capability switches per role</p>
            </div>
            <button onClick={() => setShowNewRoleModal(true)} className="btn-primary-vibrant font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[14px]">add</span> New Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {roles.map((role) => (
              <div key={role} className="border border-border-subtle rounded-2xl p-4 bg-surface-muted/40 space-y-3">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <h3 className="font-bold text-xs sm:text-sm text-primary">{role} Role</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-bold">
                      Configured
                    </span>
                    {!systemRoles?.[role] && (
                      <button 
                        onClick={async () => {
                          const confirmed = await showConfirm(
                            'Delete Role',
                            `Are you sure you want to delete the ${role} role?`
                          );
                          if (confirmed) {
                            try {
                              await deleteRole(role);
                              showSuccess('Role deleted successfully!');
                            } catch (err: any) {
                              showError('Failed to delete role: ' + err.message);
                            }
                          }
                        }}
                        className="text-status-error hover:text-red-700 bg-status-error/10 hover:bg-status-error/20 p-1 rounded transition-colors"
                        title="Delete Role"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {navStructure.map((menu) => (
                    <div key={menu.id} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-on-surface">{menu.label}</p>
                        <p className="text-[10px] text-on-surface-variant">Access {menu.label}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-2">
                        <input
                          type="checkbox"
                          checked={permissionsMatrix[role]?.[menu.id] || false}
                          onChange={() => togglePermission(role, menu.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 sm:w-9 sm:h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 sm:after:h-4 sm:after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border-subtle flex justify-between items-center">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-primary">Active Team Directory</h2>
            <span className="text-xs text-on-surface-variant font-bold">{userList.length} Staff Members</span>
          </div>

          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-surface-muted text-on-surface-variant font-label-md uppercase border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">User Name</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Email</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Role</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Department</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-bold text-primary whitespace-nowrap">{u.name}</td>
                    <td className="py-3 px-3 sm:px-4 text-on-surface-variant font-medium whitespace-nowrap">{u.email}</td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span className="bg-primary-container text-on-primary-container font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-on-surface font-medium whitespace-nowrap">{u.department}</td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'Active' ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openActionModal('view', u)} className="p-1.5 text-secondary hover:bg-surface-container rounded-lg transition-colors cursor-pointer" title="View Profile">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button onClick={() => openActionModal('edit', u)} className="p-1.5 text-secondary hover:bg-surface-container rounded-lg transition-colors cursor-pointer" title="Edit User">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => openActionModal('delete', u)} className="p-1.5 text-status-error hover:bg-status-error/10 rounded-lg transition-colors cursor-pointer" title="Remove User">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">Invite Staff Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john.doe@msbi.com"
                  className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">System Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Department</label>
                  <select
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                    className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option value="Executive Board">Executive Board</option>
                    <option value="Marketing Ops">Marketing Ops</option>
                    <option value="Neurology Program">Neurology Program</option>
                    <option value="Digital Media">Digital Media</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Action Modals */}
      {actionType && selectedUser && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            {/* View Modal */}
            {actionType === 'view' && (
              <>
                <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
                  <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">User Profile</h2>
                  <button onClick={() => setActionType(null)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-border-subtle pb-4">
                    <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xl font-bold">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-lg font-bold text-primary">{selectedUser.name}</h3>
                      <p className="text-sm font-medium text-on-surface-variant">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-on-surface-variant mb-1">Role</label>
                      <span className="bg-primary-container text-on-primary-container font-bold px-2.5 py-0.5 rounded-full text-xs">
                        {selectedUser.role}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-on-surface-variant mb-1">Status</label>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${selectedUser.status === 'Active' ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-on-surface-variant mb-1">Department</label>
                      <p className="font-medium text-sm text-on-surface">{selectedUser.department}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Edit Modal */}
            {actionType === 'edit' && (
              <>
                <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
                  <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">Edit User Details</h2>
                  <button onClick={() => setActionType(null)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <form onSubmit={handleEditUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Full Name</label>
                    <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Email Address</label>
                    <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">System Role</label>
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer">
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Pending')} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer">
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Department</label>
                    <select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer">
                      <option value="Executive Board">Executive Board</option>
                      <option value="Marketing Ops">Marketing Ops</option>
                      <option value="Neurology Program">Neurology Program</option>
                      <option value="Digital Media">Digital Media</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                    <button type="button" onClick={() => setActionType(null)} className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer">Cancel</button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Delete Modal */}
            {actionType === 'delete' && (
              <>
                <h2 className="font-headline-sm text-lg font-bold text-primary mb-2">Remove User</h2>
                <p className="text-sm font-medium text-on-surface-variant mb-5">
                  Are you sure you want to completely remove <strong>{selectedUser.name}</strong> from the system? This action cannot be undone and will revoke all access.
                </p>
                <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                  <button onClick={() => setActionType(null)} className="px-4 py-2 border border-border-subtle rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-status-error text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Removing...' : 'Confirm Removal'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* New Role Modal */}
      {showNewRoleModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-5 relative">
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <span className="material-symbols-outlined text-[20px] bg-primary/10 p-1.5 rounded-lg">shield_person</span>
                  <h2 className="font-headline-sm text-lg font-bold">Create Custom Role</h2>
                </div>
                <p className="text-xs text-on-surface-variant">Define a new system role to assign granular access controls.</p>
              </div>
              <button onClick={() => setShowNewRoleModal(false)} className="text-on-surface-variant hover:text-primary hover:bg-surface-muted p-1.5 rounded-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newRoleName.trim() && !isCreatingRole) {
                  setIsCreatingRole(true);
                  try {
                    await addRole(newRoleName.trim());
                    setShowNewRoleModal(false);
                    setNewRoleName('');
                    showSuccess('Role created successfully!');
                  } catch (error) {
                    showError('Failed to create role. It may already exist.');
                  } finally {
                    setIsCreatingRole(false);
                  }
                }
              }}
              className="space-y-5 relative"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Guest Auditor"
                  className="w-full border border-border-subtle rounded-xl px-4 py-3 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-medium"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle mt-6">
                <button type="button" onClick={() => setShowNewRoleModal(false)} className="px-5 py-2.5 border border-border-subtle rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="btn-primary-vibrant px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  {isCreatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
