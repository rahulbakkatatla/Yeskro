package backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    @Autowired
    private ListingService listingService;

    @GetMapping
    public List<Listing> getAllListings(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category) {
        if (city != null) return listingService.getListingsByCity(city);
        if (category != null) return listingService.getListingsByCategory(category);
        return listingService.getAllListings();
    }

    @PostMapping
    public ResponseEntity<Listing> createListing(@RequestBody Listing listing) {
        Listing saved = listingService.createListing(listing);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public List<Listing> getListingsByUser(@PathVariable Long userId) {
        return listingService.getListingsByUser(userId);
    }
}
