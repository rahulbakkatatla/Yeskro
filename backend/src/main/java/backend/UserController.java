package backend;

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

    @Autowired
    private OtpService otpService;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String purpose = body.get("purpose");

        if (purpose.equals("register")) {
            if (userRepository.findByPhone(phone).isPresent()) {
                return ResponseEntity.badRequest().body("Phone already registered");
            }
        } else if (purpose.equals("reset")) {
            if (userRepository.findByPhone(phone).isEmpty()) {
                return ResponseEntity.status(404).body("Phone not registered");
            }
        }

        String otp = otpService.generateOtp(phone);
        boolean sent = otpService.sendOtp(phone, otp);

        if (sent) {
            return ResponseEntity.ok("OTP sent");
        } else {
            return ResponseEntity.status(500).body("Failed to send OTP");
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String otp = body.get("otp");

        if (otpService.verifyOtp(phone, otp)) {
            return ResponseEntity.ok("OTP verified");
        } else {
            return ResponseEntity.status(400).body("Invalid or expired OTP");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        Optional<User> existing = userRepository.findByPhone(user.getPhone());
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
        String phone = body.get("phone");
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
        String phone = body.get("phone");
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

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> { u.setPassword(null); return ResponseEntity.ok(u); })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/phone/{phone}")
    public ResponseEntity<User> getUserByPhone(@PathVariable String phone) {
        return userRepository.findByPhone(phone)
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
