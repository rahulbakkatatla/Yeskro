package backend.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        phone = phone.trim();
        if (phone.startsWith("+91")) return phone.substring(3);
        if (phone.startsWith("91") && phone.length() == 12) return phone.substring(2);
        return phone;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        String normalized = normalizePhone(user.getPhone());
        user.setPhone(normalized);
        Optional<User> existing = userRepository.findByPhone(normalized);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Phone already registered");
        }
        if (user.getPassword() != null) {
            user.setPassword(encoder.encode(user.getPassword()));
        }
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String phone = normalizePhone(body.get("phone"));
        String password = body.get("password");
        Optional<User> userOpt = userRepository.findByPhone(phone);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Phone not registered");
        }
        User user = userOpt.get();
        if (user.getPassword() == null || !encoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body("Wrong password");
        }
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String phone = normalizePhone(body.get("phone"));
        String newPassword = body.get("newPassword");
        Optional<User> userOpt = userRepository.findByPhone(phone);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Phone not registered");
        }
        User user = userOpt.get();
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Password reset successfully");
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok("OTP service coming soon");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok("OTP verified");
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> { u.setPassword(null); return ResponseEntity.ok(u); })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/phone/{phone}")
    public ResponseEntity<User> getUserByPhone(@PathVariable String phone) {
        String normalized = normalizePhone(phone);
        return userRepository.findByPhone(normalized)
                .map(u -> { u.setPassword(null); return ResponseEntity.ok(u); })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody User user) {
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }
}
