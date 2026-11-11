'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { UserPlus, ShieldCheck, Mail, Lock, User as UserIcon, Edit2, Check, X, Trash2, Phone, Power, PowerOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminSettings() {
  const router = useRouter();
  const { user: authUser, role: authRole, isLoading: authLoading, isInitialized } = useAuth();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', role: 'AGENT' });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');

  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [userToToggle, setUserToToggle] = useState<any>(null);
  const [toggleConfirmText, setToggleConfirmText] = useState('');
  const [isToggling, setIsToggling] = useState(false);

  const isAuthorized = authRole === 'HIGH_LEVEL_ADMIN';

  useEffect(() => {
    if (isInitialized && !isAuthorized) {
      router.replace('/overview');
    }
  }, [isInitialized, isAuthorized, router]);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  }, [isAuthorized]);

  if (authLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-sm font-medium text-[#7D766C]">Loading administration panel...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-bold text-[#1F1E1B] mb-2">Access Denied</div>
          <div className="text-[#8d8c86] text-sm">
            You need Administrator privileges to access this page.
          </div>
        </div>
      </div>
    );
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success) setUsers(json.data);
      else showNotification(json.error || 'Failed to load users', 'error');
    } catch (error) {
      showNotification('Failed to load administration data.', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('User created successfully!', 'success');
        setNewUser({ name: '', email: '', phone: '', password: '', role: 'AGENT' }); 
        fetchUsers(); 
      } else {
        showNotification(json.error, 'error');
      }
    } catch (error) {
      showNotification('An error occurred while creating user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUserId(user.User_ID);
    setEditRole(user.User_Role);
    setEditPhone(user.User_Phone || '');
  };

  const handleSaveChanges = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole: editRole, newPhone: editPhone }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('User details updated successfully!', 'success');
        setEditingUserId(null);
        fetchUsers(); 
      } else {
        showNotification(json.error, 'error');
      }
    } catch (error) {
      showNotification('Failed to update user details.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users?id=${userToDelete.User_ID}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showNotification(`${userToDelete.User_Name || 'User'} has been deleted permanently.`, 'success');
        setUserToDelete(null);
        setDeleteConfirmText('');
        fetchUsers();
      } else {
        showNotification(json.error, 'error');
      }
    } catch (error) {
      showNotification('Failed to delete user.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const executeToggleStatus = async () => {
    if (!userToToggle) return;
    setIsToggling(true);
    try {
      const newStatus = userToToggle.is_active === false ? true : false;
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToToggle.User_ID, isActive: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(newStatus ? 'User activated successfully' : 'User deactivated successfully', 'success');
        fetchUsers(); 
        setUserToToggle(null);
        setToggleConfirmText('');
      } else {
        showNotification(json.error, 'error');
      }
    } catch (error) {
      showNotification('Failed to change user status.', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <Header
        title="User Administration"
        subtitle="Create new system accounts, assign roles, and manage access."
        icon={<ShieldCheck className="w-5 h-5" />}
        showBackButton={false}
      />

      <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto w-full">
        {notification && (
          <div className={`p-4 rounded-xl shadow-sm border ${notification.type === 'success' ? 'bg-[#E5EFE9] text-[#1F3B34] border-[#d1e3dc]' : 'bg-[#FEE2E2] text-[#991b1b] border-[#FCA5A5]'}`}>
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Form */}
          <div className="xl:col-span-1">
            <div className="bg-white border border-[#E9E4DC] rounded-[24px] shadow-sm p-6">
              <h3 className="text-[14.5px] font-bold text-[#1F1E1B] mb-5 flex items-center gap-2 border-b border-[#F5EFE6] pb-2">
                <UserPlus size={18} className="text-[#1F3B34]" /> Add New User
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#A49C8F] tracking-wider">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A296]" />
                    <input required type="text" placeholder="e.g. Ali" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full pl-9 pr-3 py-2.5 text-[13px] text-[#1E2022] font-medium rounded-xl border border-[#E9E4DC] outline-none focus:border-[#1F3B34] focus:ring-1 focus:ring-[#1F3B34]/20 bg-[#FCF9F4]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#A49C8F] tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A296]" />
                    <input required type="email" placeholder="ali@nikahkaru.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full pl-9 pr-3 py-2.5 text-[13px] text-[#1E2022] font-medium rounded-xl border border-[#E9E4DC] outline-none focus:border-[#1F3B34] focus:ring-1 focus:ring-[#1F3B34]/20 bg-[#FCF9F4]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#A49C8F] tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A296]" />
                    <input type="text" placeholder="e.g. 03001234567" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} className="w-full pl-9 pr-3 py-2.5 text-[13px] text-[#1E2022] font-medium rounded-xl border border-[#E9E4DC] outline-none focus:border-[#1F3B34] focus:ring-1 focus:ring-[#1F3B34]/20 bg-[#FCF9F4]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#A49C8F] tracking-wider">Assign Role</label>
                  <Select value={newUser.role} onValueChange={(val) => setNewUser({...newUser, role: val || 'AGENT'})}>
                    <SelectTrigger className="w-full h-10 px-3 text-[13px] text-[#1E2022] font-medium border-[#E9E4DC] bg-[#FCF9F4] rounded-xl focus:ring-1 focus:ring-[#1F3B34]/20">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl">
                      <SelectItem value="HIGH_LEVEL_ADMIN">High Level Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value={"DEVELOPER" as any}>Developer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#A49C8F] tracking-wider">Temporary Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A296]" />
                    <input required type="text" placeholder="min 6 characters..." value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} minLength={6} className="w-full pl-9 pr-3 py-2.5 text-[13px] text-[#1E2022] font-medium rounded-xl border border-[#E9E4DC] outline-none focus:border-[#1F3B34] focus:ring-1 focus:ring-[#1F3B34]/20 bg-[#FCF9F4]" />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1F3B34] text-white hover:bg-[#172E29] font-bold text-[13px] px-5 py-3 rounded-full shadow-sm transition duration-150 transform hover:-translate-y-0.5 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create User Account'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: List */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border border-[#ECE5D9] rounded-[28px] shadow-sm p-6 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#F5EFE6] pb-4 mb-4">
                <ShieldCheck size={18} className="text-[#1F3B34]" />
                <h3 className="text-[14.5px] font-bold text-[#1F1E1B]">Registered Users</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[#888174] font-medium text-[11.5px] uppercase tracking-wider">
                      <th className="pb-3 px-3">Name</th>
                      <th className="pb-3 px-3">Email</th>
                      <th className="pb-3 px-3">Phone</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F7F3EB] text-[13px] text-[#2A2925]">
                    {users.map((u) => {
                      const isSelf = u.User_ID === authUser?.id;
                      const isTargetDeveloper = u.User_Role === ('DEVELOPER' as any);
                      const isCurrentDeveloper = authRole === ('DEVELOPER' as any);
                      
                      const canDelete = !isSelf && (!isTargetDeveloper || isCurrentDeveloper);
                      const canEdit = !isSelf && (u.User_Role !== ('DEVELOPER' as any) || isCurrentDeveloper);

                      return (
                        <tr key={u.User_ID} className="hover:bg-[#FAF7F2] transition-colors group">
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#1E1F22]">
                              {u.User_Name || 'N/A'} {isSelf && <span className="text-[10px] font-normal text-[#A49C8F]">(You)</span>}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[#7C756B]">{u.User_Email}</td>
                          <td className="py-3 px-3 text-[#7C756B]">
                            {editingUserId === u.User_ID ? (
                              <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone..." className="w-full h-8 px-2 text-[12px] border border-[#E9E4DC] rounded-lg outline-none focus:border-[#1F3B34] focus:ring-1 focus:ring-[#1F3B34]/20 bg-white" />
                            ) : (
                              u.User_Phone || 'N/A'
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {editingUserId === u.User_ID ? (
                              <Select value={editRole} onValueChange={(val) => setEditRole(val || 'AGENT')}>
                                <SelectTrigger className="w-[140px] h-8 px-2 text-[12px] font-medium border-[#E9E4DC] bg-white rounded-lg">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl">
                                  <SelectItem value="HIGH_LEVEL_ADMIN">High Level Admin</SelectItem>
                                  <SelectItem value="MANAGER">Manager</SelectItem>
                                  <SelectItem value="AGENT">Agent</SelectItem>
                                  {isCurrentDeveloper && <SelectItem value={"DEVELOPER" as any}>Developer</SelectItem>}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                  ${(u.User_Role === 'HIGH_LEVEL_ADMIN' || u.User_Role === ('DEVELOPER' as any)) ? 'bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]' : 
                                    u.User_Role === 'MANAGER' ? 'bg-[#FDF0D8] text-[#8B6122] border border-[#F6E1BA]' : 
                                    'bg-[#F4EFE7] text-[#696256] border border-[#ECE4D8]'}`}>
                                  {u.User_Role.replace(/_/g, ' ')}
                                </span>
                                {u.is_active === false && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/40">
                                    Deactivated
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end items-center gap-1">
                              {editingUserId === u.User_ID ? (
                                <>
                                  <button onClick={() => handleSaveChanges(u.User_ID)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#E5EFE9] text-[#137333] shadow-sm"><Check size={14} strokeWidth={3} /></button>
                                  <button onClick={() => setEditingUserId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#FEE2E2] text-[#991B1B] shadow-sm"><X size={14} strokeWidth={3} /></button>
                                </>
                              ) : (
                                <>
                                  {canEdit && (
                                    <button onClick={() => handleEditClick(u)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#F4ECE1] text-[#24211D] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" title="Edit Role & Phone">
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <>
                                      <button onClick={() => setUserToToggle(u)} className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[#E9E4DC] bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${u.is_active === false ? 'text-[#137333] hover:bg-[#E5EFE9]' : 'text-[#8B6122] hover:bg-[#FDF0D8]'}`} title={u.is_active === false ? 'Activate User' : 'Deactivate User'}>
                                        {u.is_active === false ? <Power size={14} /> : <PowerOff size={14} />}
                                      </button>
                                      <button onClick={() => setUserToDelete(u)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#FEE2E2] text-[#991B1B] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" title="Delete User">
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Modals for Toggle and Delete since AlertDialog is not used */}
        {userToToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-xl border border-[#ECE5D9]">
              <h3 className="text-xl font-bold text-[#002b17] mb-2 flex items-center gap-2">
                {userToToggle.is_active === false ? <Power className="text-[#137333]" /> : <PowerOff className="text-[#8B6122]" />}
                {userToToggle.is_active === false ? 'Activate' : 'Deactivate'} User
              </h3>
              <p className="text-[#7D766C] text-[13px] mb-4">
                You are about to {userToToggle.is_active === false ? 'activate' : 'deactivate'} the account of <strong className="text-[#1F1E1B]">{userToToggle.User_Name}</strong>.
              </p>
              <div className="space-y-2 mb-6">
                <label className="text-[11px] font-bold text-[#A49C8F] uppercase">Type <span className="text-[#002b17] font-mono">{userToToggle.is_active === false ? 'ACTIVATE' : 'DEACTIVATE'}</span> to confirm</label>
                <input type="text" value={toggleConfirmText} onChange={(e) => setToggleConfirmText(e.target.value)} placeholder={userToToggle.is_active === false ? 'ACTIVATE' : 'DEACTIVATE'} className="w-full px-3 py-2 border border-[#E9E4DC] rounded-xl outline-none focus:border-[#1F3B34] focus:ring-1 focus:ring-[#1F3B34]/20 font-mono tracking-widest text-sm uppercase bg-[#FCF9F4]" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setUserToToggle(null); setToggleConfirmText(''); }} className="px-4 py-2 rounded-full border border-[#E9E4DC] hover:bg-[#F4ECE1] text-[#24211D] text-[13px] font-bold">Cancel</button>
                <button onClick={executeToggleStatus} disabled={toggleConfirmText !== (userToToggle.is_active === false ? 'ACTIVATE' : 'DEACTIVATE') || isToggling} className={`px-4 py-2 rounded-full text-white text-[13px] font-bold shadow-sm disabled:opacity-50 ${userToToggle.is_active === false ? 'bg-[#16a34a] hover:bg-[#15803d]' : 'bg-[#d97706] hover:bg-[#b45309]'}`}>
                  {isToggling ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-xl border border-[#ECE5D9]">
              <h3 className="text-xl font-bold text-[#991B1B] mb-2 flex items-center gap-2">
                <Trash2 /> Delete User
              </h3>
              <p className="text-[#7D766C] text-[13px] mb-4">
                You are about to permanently delete the account of <strong className="text-[#1F1E1B]">{userToDelete.User_Name}</strong>. This action cannot be undone.
              </p>
              <div className="space-y-2 mb-6">
                <label className="text-[11px] font-bold text-[#A49C8F] uppercase">Type <span className="text-[#991B1B] font-mono">DELETE</span> to confirm</label>
                <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="w-full px-3 py-2 border border-[#E9E4DC] rounded-xl outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]/20 font-mono tracking-widest text-sm uppercase bg-[#FEE2E2]/20" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setUserToDelete(null); setDeleteConfirmText(''); }} className="px-4 py-2 rounded-full border border-[#E9E4DC] hover:bg-[#F4ECE1] text-[#24211D] text-[13px] font-bold">Cancel</button>
                <button onClick={handleDeleteUser} disabled={deleteConfirmText !== 'DELETE' || isDeleting} className="px-4 py-2 rounded-full bg-[#991B1B] hover:bg-[#7f1d1d] text-white text-[13px] font-bold shadow-sm disabled:opacity-50">
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
