package backend.common;

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

    @Value("${MSG91_AUTH_KEY:}")
    private String authKey;

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
            String url = "https://control.msg91.com/api/v5/otp?template_id=&mobile=91" + phone
                + "&authkey=" + authKey + "&otp=" + otp;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("MSG91 response: " + response.body());
            return response.statusCode() == 200;
        } catch (Exception e) {
            System.out.println("SMS send failed: " + e.getMessage());
            return false;
        }
    }
}
