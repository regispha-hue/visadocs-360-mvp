$content = Get-Content "lib/compliance.ts" -Raw; $content = $content -replace "/\*\*/", "/**"; $content = $content -replace "\*/\*", "*/"; Set-Content "lib/compliance.ts" -Value $content
