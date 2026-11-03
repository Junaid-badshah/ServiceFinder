package com.servicefinder.security;

import com.servicefinder.entity.Role;
import java.util.List;
import java.util.Map;

public class RolePermissions {
    public static final Map<Role, List<Permission>> MAP = Map.of(
            Role.ADMIN, List.of(Permission.values()),
            Role.PROVIDER, List.of(Permission.REQUEST_READ_OWN, Permission.REQUEST_ACCEPT, Permission.REQUEST_REJECT),
            Role.CUSTOMER, List.of(Permission.REQUEST_CREATE, Permission.REQUEST_READ_OWN)
    );
    public static List<Permission> getPermissions(Role role) {
        return MAP.getOrDefault(role, List.of());
    }
}
