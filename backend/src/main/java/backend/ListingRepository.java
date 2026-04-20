package backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findByCity(String city);
    List<Listing> findByCategory(String category);
    List<Listing> findByUserId(Long userId);
}
