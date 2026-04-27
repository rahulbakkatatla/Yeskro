package backend;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String phone;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;
    private String name;
    private String photoUrl;
    private String area;
    private String city;
    private String bio;
    private Boolean isVerified = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private String email;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
