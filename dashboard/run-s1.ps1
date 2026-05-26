$body = @{
    campaignId = "bb1b8e86-578b-4bca-b054-57ad7e5880f2"
    stage = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/campaigns/bb1b8e86-578b-4bca-b054-57ad7e5880f2/execute-stage" -Method POST -Body $body -ContentType "application/json"