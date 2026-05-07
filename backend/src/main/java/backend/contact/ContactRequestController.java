package backend.contact;

import backend.user.User;
import backend.listing.Listing;
import backend.user.UserRepository;
import backend.listing.ListingRepository;
import backend.email.EmailService;

import backend.user.UserRepository;
import backend.listing.ListingRepository;
import backend.email.EmailService;

import backend.user.UserRepository;
import backend.listing.ListingRepository;
import backend.email.EmailService;

import backend.user.UserRepository;
import backend.listing.ListingRepository;
import backend.email.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ContactRequestController {

    @Autowired
    private ContactRequestRepository contactRequestRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/listings/{listingId}/request-contact")
    public ResponseEntity<?> requestContact(@PathVariable Long listingId, @RequestParam Long requesterId) {
        if (contactRequestRepository.existsByRequesterIdAndListingId(requesterId, listingId)) {
            return ResponseEntity.badRequest().body("Already requested");
        }
        Optional<Listing> listingOpt = listingRepository.findById(listingId);
        Optional<User> requesterOpt = userRepository.findById(requesterId);
        if (listingOpt.isEmpty() || requesterOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Listing listing = listingOpt.get();
        User requester = requesterOpt.get();
        User poster = listing.getUser();

        ContactRequest req = new ContactRequest();
        req.setListing(listing);
        req.setRequester(requester);
        req.setStatus("pending");
        contactRequestRepository.save(req);

        // Send email to poster
        if (poster.getEmail() != null && !poster.getEmail().isEmpty()) {
            emailService.sendConnectRequestNotification(
                poster.getEmail(),
                poster.getName(),
                listing.getTitle(),
                requester.getName(),
                requester.getArea()
            );
        }

        return ResponseEntity.ok(req);
    }

    @GetMapping("/users/{userId}/contact-requests")
    public ResponseEntity<List<ContactRequest>> getRequestsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(contactRequestRepository.findByListingUserId(userId));
    }

    @GetMapping("/users/{userId}/my-requests")
    public ResponseEntity<List<ContactRequest>> getMyRequests(@PathVariable Long userId) {
        return ResponseEntity.ok(contactRequestRepository.findByRequesterId(userId));
    }

    @PutMapping("/contact-requests/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        Optional<ContactRequest> reqOpt = contactRequestRepository.findById(id);
        if (reqOpt.isEmpty()) return ResponseEntity.notFound().build();
        ContactRequest req = reqOpt.get();
        req.setStatus("approved");
        contactRequestRepository.save(req);

        // Send email to requester
        User requester = req.getRequester();
        User poster = req.getListing().getUser();
        if (requester.getEmail() != null && !requester.getEmail().isEmpty()) {
            emailService.sendRequestApprovedNotification(
                requester.getEmail(),
                requester.getName(),
                req.getListing().getTitle(),
                poster.getName(),
                poster.getPhone()
            );
        }

        return ResponseEntity.ok(req);
    }

    @PutMapping("/contact-requests/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        Optional<ContactRequest> reqOpt = contactRequestRepository.findById(id);
        if (reqOpt.isEmpty()) return ResponseEntity.notFound().build();
        ContactRequest req = reqOpt.get();
        req.setStatus("rejected");
        contactRequestRepository.save(req);
        return ResponseEntity.ok(req);
    }

    @DeleteMapping("/contact-requests/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Long id) {
        if (!contactRequestRepository.existsById(id)) return ResponseEntity.notFound().build();
        contactRequestRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}
