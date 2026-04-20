package backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ListingService {

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public List<Listing> getListingsByCity(String city) {
        return listingRepository.findByCity(city);
    }

    public List<Listing> getListingsByCategory(String category) {
        return listingRepository.findByCategory(category);
    }

    public Listing createListing(Listing listing) {
        return listingRepository.save(listing);
    }

    public List<Listing> getListingsByUser(Long userId) {
        return listingRepository.findByUserId(userId);
    }
}
