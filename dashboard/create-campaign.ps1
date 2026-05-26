$body = @{
    name = "Clean Test Campaign"
    topic = "Remote Work Productivity Study"
    targetRegion = "United States"
    targetBeats = @("Business", "Tech")
    tone = "Professional"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/campaigns" -Method POST -Body $body -ContentType "application/json"