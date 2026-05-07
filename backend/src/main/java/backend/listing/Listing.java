package backend.listing;

import backend.user.User;

import backend.user.User;

import backend.user.User;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "listings")
@Data
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String title;
    private String description;
    private String category;
    private String type;
    private String area;
    private String city;
    private Double budgetMin;
    private Double budgetMax;
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        expiresAt = LocalDateTime.now().plusDays(7);
    }
}
