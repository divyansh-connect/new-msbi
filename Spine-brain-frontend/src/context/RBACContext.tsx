import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/crm';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

export type PermissionsMap = Record<string, boolean>;
export type PermissionsMatrixType = Record<UserRole, PermissionsMap>;

export interface RoleData {
  name: string;
  permissions: PermissionsMap;
  isSystem: boolean;
}

interface RBACContextType {
  roles: UserRole[];
  permissionsMatrix: PermissionsMatrixType;
  systemRoles: Record<string, boolean>;
  togglePermission: (role: UserRole, permissionKey: string) => Promise<void>;
  hasPermission: (role: UserRole, permissionKey: string) => boolean;
  addRole: (roleName: string) => Promise<void>;
  deleteRole: (roleName: string) => Promise<void>;
  loading: boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionsMatrixType>({});
  const [systemRoles, setSystemRoles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      const res = await apiClient<{ success: boolean; data: RoleData[] }>('/roles');
      if (res.success && res.data) {
        const newRoles: string[] = [];
        const newMatrix: PermissionsMatrixType = {};
        const newSystemRoles: Record<string, boolean> = {};

        res.data.forEach((role) => {
          newRoles.push(role.name);
          newMatrix[role.name] = role.permissions || {};
          newSystemRoles[role.name] = role.isSystem;
        });

        setRoles(newRoles);
        setPermissionsMatrix(newMatrix);
        setSystemRoles(newSystemRoles);
      }
    } catch (error: any) {
      console.error('Failed to fetch roles:', error?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoles();
    } else {
      setRoles([]);
      setPermissionsMatrix({});
      setSystemRoles({});
      setLoading(false);
    }
  }, [isAuthenticated, user?.email, user?.role]);


  const togglePermission = async (role: UserRole, permissionKey: string) => {
    // Optimistic UI update
    const previousMatrix = { ...permissionsMatrix };
    const currentPermission = permissionsMatrix[role]?.[permissionKey] || false;
    
    setPermissionsMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionKey]: !currentPermission
      }
    }));

    try {
      const updatedPermissions = {
        ...previousMatrix[role],
        [permissionKey]: !currentPermission
      };
      
      await apiClient(`/roles/${encodeURIComponent(role)}`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: updatedPermissions })
      });
    } catch (error: any) {
      console.error('Failed to update permission:', error?.message || 'Network error');
      // Revert on failure
      setPermissionsMatrix(previousMatrix);
    }
  };

  const hasPermission = (role: UserRole, permissionKey: string): boolean => {
    if (role === 'Admin') return true;
    return permissionsMatrix[role]?.[permissionKey] ?? false;
  };

  const addRole = async (roleName: string) => {
    try {
      const res = await apiClient<{ success: boolean; data: RoleData }>('/roles', {
        method: 'POST',
        body: JSON.stringify({ name: roleName })
      });
      if (res.success && res.data) {
        setRoles([...roles, res.data.name]);
        setPermissionsMatrix((prev) => ({
          ...prev,
          [res.data.name]: res.data.permissions || {}
        }));
        setSystemRoles((prev) => ({
          ...prev,
          [res.data.name]: res.data.isSystem
        }));
      }
    } catch (error: any) {
      console.error('Failed to add role:', error?.message || 'Network error');
      throw error;
    }
  };

  const deleteRole = async (roleName: string) => {
    try {
      const res = await apiClient<{ success: boolean }>(`/roles/${encodeURIComponent(roleName)}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setRoles(roles.filter(r => r !== roleName));
        const newMatrix = { ...permissionsMatrix };
        delete newMatrix[roleName];
        setPermissionsMatrix(newMatrix);
        const newSystem = { ...systemRoles };
        delete newSystem[roleName];
        setSystemRoles(newSystem);
      }
    } catch (error: any) {
      console.error('Failed to delete role:', error?.message || 'Network error');
      throw error;
    }
  };

  return (
    <RBACContext.Provider value={{ 
      roles, 
      permissionsMatrix, 
      systemRoles,
      togglePermission, 
      hasPermission, 
      addRole,
      deleteRole,
      loading 
    }}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
