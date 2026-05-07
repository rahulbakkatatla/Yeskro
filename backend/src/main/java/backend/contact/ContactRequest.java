package backend.contact;

import backend.user.User;
import backend.listing.Listing;

import backend.user.User;
import backend.listing.Listing;

import backend.user.User;
import backend.listing.Listing;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "contact_requests")
@Data
public class ContactRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "requester_id")
    private User requester;

    @ManyToOne
    @JoinColumn(name = "listing_id")
    private Listing listing;

    private String status = "pending";
    private String message;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
