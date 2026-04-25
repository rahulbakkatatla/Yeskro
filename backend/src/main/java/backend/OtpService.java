package backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

@Service
public class OtpService {

    @Value("${FAST2SMS_API_KEY}")
    private String apiKey;

    private Map<String, String> otpStore = new HashMap<>();

    public String generateOtp(String phone) {
        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        otpStore.put(phone, otp);
        return otp;
    }

    public boolean verifyOtp(String phone, String otp) {
        String stored = otpStore.get(phone);
        if (stored != null && stored.equals(otp)) {
            otpStore.remove(phone);
            return true;
        }
        return false;
    }

    public boolean sendOtp(String phone, String otp) {
        try {
            String url = "https://www.fast2sms.com/dev/bulkV2?authorization=" + apiKey
                + "&route=otp&variables_values=" + otp
                + "&flash=0&numbers=" + phone;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            System.out.println("SMS send failed: " + e.getMessage());
            return false;
        }
    }
}
