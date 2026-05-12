package backend.trust;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TrustScoreRepository extends JpaRepository<TrustScore, Long> {
    
    Optional<TrustScore> findByUserId(Long userId);
    
    boolean existsByUserId(Long userId);
}