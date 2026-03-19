package tn.fst.authservice.dto;

import lombok.Data;
import tn.fst.authservice.entity.Role;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String name;
    private Role role;
}
