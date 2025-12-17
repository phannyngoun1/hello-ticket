/**
 * React Hook for managing roles
 *
 * @author Phanny
 */

import { useState, useEffect } from "react";
import { RoleService } from "./role-service";
import { Role } from "../types";

export interface UseRolesParams {
  includeSystemRoles?: boolean;
  autoFetch?: boolean;
}

export function useRoles(service: RoleService, params?: UseRolesParams) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const includeSystemRoles = params?.includeSystemRoles ?? true;

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.fetchRoles(includeSystemRoles);
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch roles"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.autoFetch !== false) {
      fetchRoles();
    }
  }, [includeSystemRoles]);

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
  };
}

export function useRole(service: RoleService, roleId: string | null) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roleId) {
      setRole(null);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await service.fetchRole(roleId);
        setRole(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch role"));
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [service, roleId]);

  return {
    role,
    loading,
    error,
  };
}

