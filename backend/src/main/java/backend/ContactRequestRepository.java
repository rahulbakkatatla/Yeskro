package backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactRequestRepository extends JpaRepository<ContactRequest, Long> {
    List<ContactRequest> findByListingUserId(Long userId);
    List<ContactRequest> findByRequesterId(Long requesterId);
    boolean existsByRequesterIdAndListingId(Long requesterId, Long listingId);
}
