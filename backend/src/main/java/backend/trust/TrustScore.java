package backend.trust;

import backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trust_scores")
public class TrustScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private String badge;

    @Column(length = 500)
    private String reasoning;

    @Column(nullable = false)
    private Boolean isLlmScore;

    private String promptVersion;

    @Column(nullable = false)
    private LocalDateTime calculatedAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }

    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }

    public Boolean getIsLlmScore() { return isLlmScore; }
    public void setIsLlmScore(Boolean isLlmScore) { this.isLlmScore = isLlmScore; }

    public String getPromptVersion() { return promptVersion; }
    public void setPromptVersion(String promptVersion) { this.promptVersion = promptVersion; }

    public LocalDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(LocalDateTime calculatedAt) { this.calculatedAt = calculatedAt; }
}