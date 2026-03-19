package tn.fst.authservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.fst.authservice.dto.AuthResponse;
import tn.fst.authservice.dto.LoginRequest;
import tn.fst.authservice.dto.RegisterRequest;
import tn.fst.authservice.dto.UserResponse;
import tn.fst.authservice.entity.User;
import tn.fst.authservice.repository.UserRepository;
import tn.fst.authservice.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {

        // ✅ Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        userRepository.save(user);

        return new AuthResponse(jwtService.generateToken(user.getEmail()));
    }

    public AuthResponse login(LoginRequest request) {

        // ✅ Let Spring Security handle authentication (wrong password, user not found)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // ✅ If we reach here, credentials are valid
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new AuthResponse(jwtService.generateToken(user.getEmail()));
    }
    // ✅ add at the end of AuthService.java
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole().name());
        return response;
    }

    public boolean userExists(String email) {
        return userRepository.existsByEmail(email);
    }
}