package tn.fst.authservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.fst.authservice.dto.AuthResponse;
import tn.fst.authservice.dto.LoginRequest;
import tn.fst.authservice.dto.RegisterRequest;
import tn.fst.authservice.dto.UpdateProfileRequest;
import tn.fst.authservice.dto.UserResponse;
import tn.fst.authservice.service.AuthService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
    // ✅ add at the end of AuthController.java
    @GetMapping("/users/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(authService.getUserByEmail(email));
    }

    @GetMapping("/users/{email}/exists")
    public ResponseEntity<Boolean> userExists(@PathVariable String email) {
        return ResponseEntity.ok(authService.userExists(email));
    }

    @PutMapping("/users/{email}")
    public ResponseEntity<UserResponse> updateProfile(
            @PathVariable String email,
            @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfile(email, request));
    }
}
