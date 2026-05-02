package backend;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${RESEND_API_KEY:}")
    private String apiKey;

    public void sendConnectRequestNotification(String toEmail, String toName, String listingTitle, String requesterName, String requesterArea) {
        if (apiKey == null || apiKey.isEmpty() || toEmail == null || toEmail.isEmpty()) return;
        try {
            Resend resend = new Resend(apiKey);
            CreateEmailOptions params = CreateEmailOptions.builder()
                .from("Yeskro <notifications@yeskro.in>")
                .to(toEmail)
                .subject("New connect request on Yeskro 🔔")
                .html("<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px'>" +
                    "<h2 style='color:#111;font-size:24px;margin-bottom:4px'>Wor<span style='color:#14b8a6'>bid</span></h2>" +
                    "<p style='color:#666;font-size:14px;margin-bottom:24px'>Your local marketplace</p>" +
                    "<p style='color:#111;font-size:16px'>Hi <strong>" + toName + "</strong>,</p>" +
                    "<p style='color:#444;font-size:15px'><strong>" + requesterName + "</strong> from <strong>" + requesterArea + "</strong> wants to connect with your listing:</p>" +
                    "<div style='background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px;margin:20px 0'>" +
                    "<p style='color:#0f766e;font-weight:bold;margin:0;font-size:15px'>📋 " + listingTitle + "</p>" +
                    "</div>" +
                    "<a href='Yeskro.in' style='display:block;background:#111;color:#fff;text-decoration:none;padding:14px 24px;border-radius:12px;text-align:center;font-weight:bold;font-size:15px;margin:20px 0'>Open Yeskro to Approve →</a>" +
                    "<p style='color:#999;font-size:12px;margin-top:24px'>You're receiving this because someone connected with your listing on Yeskro.</p>" +
                    "</div>")
                .build();
            resend.emails().send(params);
        } catch (ResendException e) {
            System.out.println("Email send failed: " + e.getMessage());
        }
    }

    public void sendRequestApprovedNotification(String toEmail, String toName, String listingTitle, String posterName, String posterPhone) {
        if (apiKey == null || apiKey.isEmpty() || toEmail == null || toEmail.isEmpty()) return;
        try {
            Resend resend = new Resend(apiKey);
            CreateEmailOptions params = CreateEmailOptions.builder()
                .from("Yeskro <notifications@yeskro.in>")
                .to(toEmail)
                .subject("Your connect request was approved! 🎉")
                .html("<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px'>" +
                    "<h2 style='color:#111;font-size:24px;margin-bottom:4px'>Wor<span style='color:#14b8a6'>bid</span></h2>" +
                    "<p style='color:#666;font-size:14px;margin-bottom:24px'>Your local marketplace</p>" +
                    "<p style='color:#111;font-size:16px'>Hi <strong>" + toName + "</strong>,</p>" +
                    "<p style='color:#444;font-size:15px'>Great news! <strong>" + posterName + "</strong> approved your connect request for:</p>" +
                    "<div style='background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px;margin:20px 0'>" +
                    "<p style='color:#0f766e;font-weight:bold;margin:0;font-size:15px'>📋 " + listingTitle + "</p>" +
                    "</div>" +
                    "<p style='color:#444;font-size:15px'>You can now see their contact number on Yeskro.</p>" +
                    "<a href='https://Yeskro.in' style='display:block;background:#111;color:#fff;text-decoration:none;padding:14px 24px;border-radius:12px;text-align:center;font-weight:bold;font-size:15px;margin:20px 0'>Open Yeskro to View Contact →</a>" +
                    "<p style='color:#999;font-size:12px;margin-top:24px'>You're receiving this because your connect request was approved on Yeskro.</p>" +
                    "</div>")
                .build();
            resend.emails().send(params);
        } catch (ResendException e) {
            System.out.println("Email send failed: " + e.getMessage());
        }
    }
}
