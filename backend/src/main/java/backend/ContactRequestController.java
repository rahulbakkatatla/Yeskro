package backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ContactRequestController {

    @Autowired
    private ContactRequestRepository contactRequestRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/listings/{listingId}/request-contact")
    public ResponseEntity<?> requestContact(
            @PathVariable Long listingId,
            @RequestParam Long requesterId) {

        if (contactRequestRepository.existsByRequesterIdAndListingId(requesterId, listingId)) {
            return ResponseEntity.badRequest().body("Request already sent");
        }

        Listing listing = listingRepository.findById(listingId).orElseThrow();
        User requester = userRepository.findById(requesterId).orElseThrow();

        if (listing.getUser() != null && listing.getUser().getId().equals(requesterId)) {
            return ResponseEntity.badRequest().body("Cannot request your own listing");
        }

        ContactRequest request = new ContactRequest();
        request.setListing(listing);
        request.setRequester(requester);
        request.setStatus("pending");

        contactRequestRepository.save(request);
        return ResponseEntity.ok("Request sent");
    }

    @GetMapping("/users/{userId}/contact-requests")
    public List<ContactRequest> getRequestsForUser(@PathVariable Long userId) {
        return contactRequestRepository.findByListingUserId(userId);
    }

    @GetMapping("/users/{userId}/my-requests")
    public List<ContactRequest> getMyRequests(@PathVariable Long userId) {
        return contactRequestRepository.findByRequesterId(userId);
    }

    @PutMapping("/contact-requests/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        ContactRequest request = contactRequestRepository.findById(id).orElseThrow();
        request.setStatus("approved");
        contactRequestRepository.save(request);
        return ResponseEntity.ok(request);
    }

    @PutMapping("/contact-requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id) {
        ContactRequest request = contactRequestRepository.findById(id).orElseThrow();
        request.setStatus("rejected");
        contactRequestRepository.save(request);
        return ResponseEntity.ok("Rejected");
    }
}
