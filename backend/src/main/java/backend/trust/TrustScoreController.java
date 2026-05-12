package backend.trust;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trust-scores")
public class TrustScoreController {

    @Autowired
    private TrustScoreService trustScoreService;

    @PostMapping("/calculate/{userId}")
    public ResponseEntity<TrustScore> calculateTrustScore(@PathVariable Long userId) {
        TrustScore score = trustScoreService.calculateTrustScore(userId);
        return ResponseEntity.ok(score);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<TrustScore> getTrustScore(@PathVariable Long userId) {
        TrustScore score = trustScoreService.getTrustScoreByUserId(userId);
        if (score == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(score);
    }
}