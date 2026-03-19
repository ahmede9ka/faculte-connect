package tn.fst.authservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)  // ✅ unique + not null
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
}