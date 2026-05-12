package backend.trust;

import backend.user.User;
import backend.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TrustScoreService {

    @Autowired
    private TrustScoreRepository trustScoreRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public TrustScore calculateTrustScore(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Build worker profile from user data
        Map<String, Object> workerProfile = new HashMap<>();
        workerProfile.put("transaction_count", 23); // Replace with actual data from transactions
        workerProfile.put("average_rating", 4.6);   // Replace with actual average rating
        workerProfile.put("dispute_count", 0);       // Replace with actual dispute count
        workerProfile.put("response_rate", 87);      // Replace with actual response rate
        workerProfile.put("account_age_days", 180);  // Calculate from user.createdAt
        workerProfile.put("aadhaar_verified", true); // Replace with user.isAadhaarVerified
        workerProfile.put("categories", List.of("Home Services", "Electrical")); // From user categories
        workerProfile.put("recent_reviews", List.of(
            "Great work",
            "Very professional",
            "On time delivery"
        )); // Replace with actual reviews

        // Call Python script
        String pythonScriptPath = System.getProperty("user.dir") + "/ai/trust_score.py";
        
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                "python3",
                pythonScriptPath
            );
            
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            // Read output
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );
            
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("Python script failed with exit code: " + exitCode);
            }

            // Parse JSON response
            JsonNode resultNode = objectMapper.readTree(output.toString());
            
            // Create or update TrustScore entity
            TrustScore trustScore = trustScoreRepository.findByUserId(userId)
                .orElse(new TrustScore());
            
            trustScore.setUser(user);
            trustScore.setScore(resultNode.get("score").asInt());
            trustScore.setBadge(resultNode.get("badge").asText());
            trustScore.setReasoning(resultNode.get("reasoning").asText());
            trustScore.setIsLlmScore(resultNode.get("is_llm_score").asBoolean());
            trustScore.setPromptVersion("v1.0");
            trustScore.setCalculatedAt(LocalDateTime.now());

            return trustScoreRepository.save(trustScore);

        } catch (Exception e) {
            // Fallback to rule-based calculation
            TrustScore trustScore = trustScoreRepository.findByUserId(userId)
                .orElse(new TrustScore());
            
     int score = Math.min(100, 
    30 + 
    (int) Math.min(30, 23 * 1.5) +
    (int) Math.min(25, (4.6 - 1) * 10) + 
    15
);
            String badge = score < 40 ? "Bronze" : 
                          score < 60 ? "Silver" : 
                          score < 80 ? "Gold" : "Platinum";
            
            trustScore.setUser(user);
            trustScore.setScore((int) score);
            trustScore.setBadge(badge);
            trustScore.setReasoning("Fallback score due to LLM unavailability");
            trustScore.setIsLlmScore(false);
            trustScore.setPromptVersion("v1.0");
            trustScore.setCalculatedAt(LocalDateTime.now());

            return trustScoreRepository.save(trustScore);
        }
    }

    public TrustScore getTrustScoreByUserId(Long userId) {
        return trustScoreRepository.findByUserId(userId)
            .orElse(null);
    }
}