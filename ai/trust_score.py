import anthropic
import json

client = anthropic.Anthropic(api_key="your-api-key")

def calculate_trust_score(worker_profile: dict) -> dict:
    
    system_prompt = """You are a Trust Score evaluator for Yeskro, 
    a verified Indian marketplace. Evaluate worker trustworthiness 
    based on their profile data. Return ONLY a JSON object with exactly 
    three fields:
    - score: integer between 0 and 100
    - badge: one of "Bronze", "Silver", "Gold", "Platinum"  
    - reasoning: single sentence under 30 words explaining the score
    
    Do not return any text outside the JSON object.
    Do not use markdown formatting.
    If data is insufficient, return score 30, badge Bronze, 
    reasoning "Insufficient data to evaluate reliably." """
    
    user_message = f"""Worker Profile:
    Transaction count: {worker_profile.get('transaction_count', 0)}
    Average rating: {worker_profile.get('average_rating', 0)}
    Dispute count: {worker_profile.get('dispute_count', 0)}
    Response rate: {worker_profile.get('response_rate', 0)}%
    Account age days: {worker_profile.get('account_age_days', 0)}
    Aadhaar verified: {worker_profile.get('aadhaar_verified', False)}
    Categories: {', '.join(worker_profile.get('categories', []))}
    Recent reviews: {' | '.join(worker_profile.get('recent_reviews', []))}
    
    Evaluate this worker and return the Trust Score JSON."""
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=200,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )
        
        raw_text = response.content[0].text
        trust_data = json.loads(raw_text)
        
        # Validate schema
        assert isinstance(trust_data['score'], int)
        assert 0 <= trust_data['score'] <= 100
        assert trust_data['badge'] in ['Bronze', 'Silver', 'Gold', 'Platinum']
        assert isinstance(trust_data['reasoning'], str)
        
        trust_data['is_llm_score'] = True
        return trust_data
        
    except (json.JSONDecodeError, KeyError, AssertionError):
        # Fallback rule-based score
        score = min(100, 
            30 + 
            min(30, worker_profile.get('transaction_count', 0) * 1.5) +
            min(25, (worker_profile.get('average_rating', 0) - 1) * 10) +
            (15 if worker_profile.get('aadhaar_verified') else 0)
        )
        badge = 'Bronze' if score < 40 else 'Silver' if score < 60 else 'Gold' if score < 80 else 'Platinum'
        return {
            'score': int(score),
            'badge': badge,
            'reasoning': 'Score calculated using rule-based fallback due to LLM unavailability.',
            'is_llm_score': False
        }

# Test it
if __name__ == "__main__":
    test_profile = {
        'transaction_count': 23,
        'average_rating': 4.6,
        'dispute_count': 0,
        'response_rate': 87,
        'account_age_days': 180,
        'aadhaar_verified': True,
        'categories': ['Home Services', 'Electrical'],
        'recent_reviews': [
            'Fixed my AC quickly and professionally',
            'Very reliable, came on time',
            'Good work but slightly expensive'
        ]
    }
    
    result = calculate_trust_score(test_profile)
    print(json.dumps(result, indent=2))