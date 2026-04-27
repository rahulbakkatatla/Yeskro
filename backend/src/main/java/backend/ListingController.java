package backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    @Autowired
    private ListingRepository listingRepository;

    @GetMapping
    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createListing(@RequestBody Listing listing) {
        if (listing.getUser() != null && listing.getUser().getId() != null) {
            List<Listing> existing = listingRepository.findByUserId(listing.getUser().getId());
            long activeCount = existing.stream().filter(l -> l.getIsActive() != Boolean.FALSE).count();
            if (activeCount >= 5) {
                return ResponseEntity.badRequest().body("You can only have 5 active listings at a time. Close or delete existing ones first.");
            }
        }
        return ResponseEntity.ok(listingRepository.save(listing));
    }

    @GetMapping("/user/{userId}")
    public List<Listing> getListingsByUser(@PathVariable Long userId) {
        return listingRepository.findByUserId(userId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateListing(@PathVariable Long id, @RequestBody Listing updated) {
        Optional<Listing> opt = listingRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Listing listing = opt.get();
        listing.setTitle(updated.getTitle());
        listing.setDescription(updated.getDescription());
        listing.setCategory(updated.getCategory());
        listing.setType(updated.getType());
        listing.setArea(updated.getArea());
        listing.setCity(updated.getCity());
        listing.setBudgetMin(updated.getBudgetMin());
        listing.setBudgetMax(updated.getBudgetMax());
        return ResponseEntity.ok(listingRepository.save(listing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Long id) {
        if (!listingRepository.existsById(id)) return ResponseEntity.notFound().build();
        listingRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeListing(@PathVariable Long id) {
        Optional<Listing> opt = listingRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Listing listing = opt.get();
        listing.setIsActive(false);
        return ResponseEntity.ok(listingRepository.save(listing));
    }
}
